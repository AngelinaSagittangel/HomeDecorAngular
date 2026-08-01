import { ChangeDetectorRef, Component, HostListener, inject, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryWithTypeType } from '../../../../types/category-with-type.type';
import { CartService } from '../../services/cart.service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ProductType } from '../../../../types/product.type';
import { environment } from '../../../../environments/environment.development';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatMenuModule,
    MatButtonModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  searchField = new FormControl();
  showedSearch: boolean = false;

  products: ProductType[] = [];
  private _snackBar = inject(MatSnackBar);
  isLogged: boolean = false;
  count: number = 0;
  serverStaticPath = environment.serverStaticPath;

  @Input() categories: CategoryWithTypeType[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
  ) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {

    this.searchField.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      if (value && value.length > 2) {
        this.productService.searchProducts(value).subscribe((data: ProductType[]) => {
          this.products = data;
          this.showedSearch = true;
          this.cdr.detectChanges();
        });
      } else {
        this.products = [];
      }
    });

    this.authService.isLogged$.subscribe((isLoggedIn: boolean) => {
      this.isLogged = isLoggedIn;
    });

    this.cartService.getCartCount().subscribe((data: { count: number } | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        const error = (data as DefaultResponseType).message;
        throw new Error(error);
      }
      this.count = (data as { count: number }).count;
    });

    this.cartService.count$.subscribe((count) => {
      this.count = count;
      this.cdr.detectChanges();
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.goLogout();
      },
      error: () => {
        this.goLogout();
      },
    });
  }

  goLogout(): void {
    this.authService.removeTokens();
    this.authService.userId = null;
    this._snackBar.open('Вы успешно вышли из системы!', undefined, { duration: 2500 });
    this.router.navigate(['']);
  }


  selectProduct(url: string) {
    this.router.navigate(['/product/' + url]);
    this.searchField.setValue('');

    this.products = [];
  }

  @HostListener('document:click', ['$event'])
  click(event: Event) {
    if (
      this.showedSearch &&
      (event.target as HTMLElement).className.indexOf('search-product') === -1
    ) {
      this.showedSearch = false;
    }
  }
}
