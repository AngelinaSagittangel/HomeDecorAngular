import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FavoriteService } from '../../../shared/services/favorite.service';
import { FavoriteType } from '../../../../types/favorite.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { environment } from '../../../../environments/environment.development';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../shared/services/cart.service';
import { CartType } from '../../../../types/cart.type';
import { CountSelector } from '../../../shared/components/count-selector/count-selector';

@Component({
  selector: 'app-favorite',
  imports: [RouterLink, CountSelector],
  templateUrl: './favorites.html',
  styleUrl: './favorite.scss',
})
export class Favorites implements OnInit {
  products: FavoriteType[] = [];
  cart: CartType | null = null;

  serverStaticPath = environment.serverStaticPath;
  // @Input() countInCart: number | undefined = 0;
  // count: number = 1;

  constructor(
    private favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    // if (this.countInCart && this.countInCart > 1) {
    //   this.count = this.countInCart;
    // }

    this.favoriteService.getFavorite().subscribe((data: FavoriteType[] | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        const error = (data as DefaultResponseType).message;
        throw new Error(error);
      }

      const favorites = data as FavoriteType[];
      this.cdr.detectChanges();

      this.cartService.getCart().subscribe((cartData: CartType | DefaultResponseType) => {
        if ((cartData as DefaultResponseType).error !== undefined) {
          const error = (cartData as DefaultResponseType).message;
          this.products = favorites.map((item) => ({
            ...item,
            countInCart: 0,
            count: 0,
          }));
          console.log(this.products);
          throw new Error(error);
        }

        this.cart = cartData as CartType;

        this.products = favorites.map((favProduct) => {
          const productInCart = this.cart?.items.find((item) => item.product.id === favProduct.id);
          if (productInCart) {
            return {
              ...favProduct,
              countInCart: productInCart.quantity,
              count: productInCart.quantity,
            };
          } else {
            return {
              ...favProduct,
              countInCart: 0,
              count: 0,
            };
          }
        });
        this.cdr.detectChanges();
      });
    });
  }

  removeItem(id: string) {
    this.favoriteService.removeFavorite(id).subscribe((data: DefaultResponseType) => {
      if (data.error) {
        throw new Error(data.message);
      }

      this.products = this.products.filter((item) => item.id !== id);
      this.cdr.detectChanges();
    });
  }

  updateCount(value: number, product: FavoriteType) {
    product.count = value;

    this.cartService
      .updateCart(product.id, product.count)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        product.countInCart = product.count;

        this.cdr.detectChanges();
      });
  }

  addToCart(product: FavoriteType) {
    const countToSend = product.count ? product.count : 1;
    this.cartService
      .updateCart(product.id, countToSend)
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        product.countInCart = countToSend;
        product.count = countToSend;

        this.cdr.detectChanges();
      });
  }

  removeFromCart(product: FavoriteType) {
    this.cartService.updateCart(product.id, 0).subscribe((data: CartType | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        const error = (data as DefaultResponseType).message;
        throw new Error(error);
      }
      product.countInCart = 0;
      product.count = 1;
      this.cdr.detectChanges();
    });
  }
}
