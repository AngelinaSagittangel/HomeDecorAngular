import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ProductService } from '../../../shared/services/product.service';
import { ProductType } from '../../../../types/product.type';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment.development';
import { CountSelector } from '../../../shared/components/count-selector/count-selector';
import { CartService } from '../../../shared/services/cart.service';
import { CartType } from '../../../../types/cart.type';
import { FavoriteService } from '../../../shared/services/favorite.service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { FavoriteType } from '../../../../types/favorite.type';
import { AuthService } from '../../../core/auth/auth-service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-detail',
  imports: [CarouselModule, ProductCard, CountSelector, MatSnackBarModule],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export class Detail implements OnInit {
  private _snackBar = inject(MatSnackBar);
  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: false,
    pullDrag: false,
    margin: 24,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1,
      },
      400: {
        items: 2,
      },
      740: {
        items: 3,
      },
      940: {
        items: 4,
      },
    },
    nav: false,
  };

  products: ProductType[] = [];
  product!: ProductType;
  serverStaticPath = environment.serverStaticPath;
  count: number = 1;
  isLogged: boolean = false;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
  ) {
    this.isLogged = this.authService.getIsLoggedIn();
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      this.productService.getProduct(params['url']).subscribe((data: ProductType) => {
        this.product = data;
        this.cdr.detectChanges();

        this.cartService.getCart().subscribe((cartData: CartType | DefaultResponseType) => {
          if ((cartData as DefaultResponseType).error !== undefined) {
            const error = (cartData as DefaultResponseType).message;
            throw new Error(error);
          }
          if (cartData as CartType) {
            const productInCart = (cartData as CartType).items.find(
              (item) => item.product.id === this.product.id,
            );

            if (productInCart) {
              this.product.countInCart = productInCart.quantity;
              this.count = this.product.countInCart;
            }
          }
        });

        if (this.authService.getIsLoggedIn()) {
          this.favoriteService
            .getFavorite()
            .subscribe((data: FavoriteType[] | DefaultResponseType) => {
              if ((data as DefaultResponseType).error !== undefined) {
                const error = (data as DefaultResponseType).message;
                throw new Error(error);
              }

              const products = data as FavoriteType[];
              const currentProductExist = products.find((item) => item.id === this.product.id);
              if (currentProductExist) {
                this.product.isInFavorite = true;
                this.cdr.detectChanges();
              }
            });
        }
      });
    });

    this.productService.getBestProducts().subscribe((data: ProductType[]) => {
      this.products = data;

      this.cdr.detectChanges();
    });
  }

  updateCount(value: number) {
    this.count = value;

    if (this.product.countInCart) {
      this.cartService
        .updateCart(this.product.id, this.count)
        .subscribe((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            const error = (data as DefaultResponseType).message;
            throw new Error(error);
          }
          this.product.countInCart = this.count;

          this.cdr.detectChanges();
        });
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
        this.product.countInCart = this.count;

        this.cdr.detectChanges();
      });
  }

  removeFromCart() {
    this.cartService
      .updateCart(this.product.id, 0)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.product.countInCart = 0;
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
