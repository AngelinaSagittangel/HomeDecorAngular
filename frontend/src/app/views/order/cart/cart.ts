import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CountSelector } from '../../../shared/components/count-selector/count-selector';
import { RouterLink } from '@angular/router';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ProductService } from '../../../shared/services/product.service';
import { ProductType } from '../../../../types/product.type';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { CartService } from '../../../shared/services/cart.service';
import { CartType } from '../../../../types/cart.type';
import { environment } from '../../../../environments/environment.development';
import { DefaultResponseType } from '../../../../types/default-response.type';

@Component({
  selector: 'app-cart',
  imports: [CountSelector, RouterLink, CarouselModule, ProductCard],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart implements OnInit {
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

  extraProducts: ProductType[] = [];
  cart: CartType | null = null;
  serverStaticPath = environment.serverStaticPath;
  totalAmount: number = 0;
  totalCount: number = 0;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.productService.getBestProducts().subscribe((data: ProductType[]) => {
      this.extraProducts = data;

      this.cdr.detectChanges();
    });

    this.cartService.getCart().subscribe((data: CartType | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        const error = (data as DefaultResponseType).message;
        throw new Error(error);
      }
      this.cart = data as CartType;

      this.cdr.detectChanges();
      this.calculateTotal();
    });
  }

  calculateTotal() {
    this.totalAmount = 0;
    this.totalCount = 0;
    if (this.cart) {
      this.cart.items.forEach((item) => {
        this.totalAmount += item.quantity * item.product.price;
        this.totalCount += item.quantity;
      });
    }
  }

  updateCount(id: string, count: number) {
    if (this.cart) {
      this.cartService.updateCart(id, count).subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          const error = (data as DefaultResponseType).message;
          throw new Error(error);
        }
        this.cart = data as CartType;

        this.calculateTotal();
        this.cdr.detectChanges();
      });
    }
  }
}
