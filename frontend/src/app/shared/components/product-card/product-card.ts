import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductType } from '../../../../types/product.type';
import { environment } from '../../../../environments/environment.development';
import { FormsModule } from '@angular/forms';
import { CountSelector } from '../count-selector/count-selector';
import { CartService } from '../../services/cart.service';
import { CartType } from '../../../../types/cart.type';
import { FavoriteService } from '../../services/favorite.service';
import { AuthService } from '../../../core/auth/auth-service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FavoriteType } from '../../../../types/favorite.type';

@Component({
  selector: 'product-card',
  imports: [RouterLink, FormsModule, CountSelector, MatSnackBarModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard implements OnInit {
  private _snackBar = inject(MatSnackBar);
  count: number = 1;
  @Input() product!: ProductType;
  @Input() isLight: boolean = false;
  @Input() countInCart: number | undefined = 0;
  serverStaticPath = environment.serverStaticPath;
  isLogged: boolean = false;

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private favoriteService: FavoriteService,
    private authService: AuthService,
  ) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    if (this.countInCart && this.countInCart > 1) {
      this.count = this.countInCart;
    }
  }

  addToCart() {
    this.cartService
      .updateCart(this.product.id, this.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.countInCart = this.count;

        this.cdr.detectChanges();
      });
  }

  updateCount(value: number) {
    this.count = value;

    if (this.countInCart) {
      this.cartService
        .updateCart(this.product.id, this.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            const error = (data as DefaultResponseType).message;
            throw new Error(error);
          }
          this.countInCart = this.count;

          this.cdr.detectChanges();
        });
    }
  }

  removeFromCart() {
    this.cartService
      .updateCart(this.product.id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.countInCart = 0;
        this.count = 1;
        this.cdr.detectChanges();
      });
  }

  updateFavorite() {
    if (!this.authService.getIsLoggedIn()) {
      this._snackBar.open('Необходимо авторизоваться!', undefined, { duration: 2500 });
      return;
    } else {
      if (this.product.isInFavorite) {
        this.favoriteService
          .removeFavorite(this.product.id)
          .subscribe((data: DefaultResponseType) => {
            if (data.error) {
              throw new Error(data.message);
            }

            this.product.isInFavorite = false;
            this.cdr.detectChanges();
          });
      } else {
        this.favoriteService
          .addFavorite(this.product.id)
          .subscribe((data: DefaultResponseType | FavoriteType) => {
            if ((data as DefaultResponseType).error !== undefined) {
              throw new Error((data as DefaultResponseType).message);
            }

            this.product.isInFavorite = true;
            this.cdr.detectChanges();
          });
      }
    }
  }
}
