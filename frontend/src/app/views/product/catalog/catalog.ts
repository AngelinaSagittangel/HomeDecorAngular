import { ChangeDetectorRef, Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { ProductType } from '../../../../types/product.type';
import { ProductService } from '../../../shared/services/product.service';
import { CategoryService } from '../../../shared/services/category.service';
import { CategoryWithTypeType } from '../../../../types/category-with-type.type';
import { CategoryFilter } from '../../../shared/components/category-filter/category-filter';
import { ActivatedRoute, Router } from '@angular/router';
import { ActiveParamsType } from '../../../../types/active-params.type';
import { ActiveParamsUtil } from '../../../shared/utils/active-params.util';
import { AppliedFilterType } from '../../../../types/applied-filter.type';
import { debounceTime, of, switchMap, tap } from 'rxjs';
import { CartService } from '../../../shared/services/cart.service';
import { CartType } from '../../../../types/cart.type';
import { FavoriteService } from '../../../shared/services/favorite.service';
import { FavoriteType } from '../../../../types/favorite.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-catalog',
  imports: [ProductCard, CategoryFilter],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  products: ProductType[] = [];
  categoryWithTypes: CategoryWithTypeType[] = [];
  activeParams: ActiveParamsType = { types: [] };
  appliedFilters: AppliedFilterType[] = [];
  sortingOpen = false;

  sortingOptions: { name: string; value: string }[] = [
    {
      name: 'От А до Я',
      value: 'az-asc',
    },
    {
      name: 'От Я до А',
      value: 'az-desc',
    },
    {
      name: 'По возрастанию цены',
      value: 'price-asc',
    },
    {
      name: 'По убыванию цены',
      value: 'price-desc',
    },
  ];

  pages: number[] = [];
  isLoading: boolean = false;
  cart: CartType | null = null;
  favoriteProducts: FavoriteType[] | null = null;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private categoryService: CategoryService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private elementRef: ElementRef,
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const sortingElement = this.elementRef.nativeElement.querySelector('.catalog-sorting');

    if (!sortingElement.contains(event.target)) {
      this.sortingOpen = false;
    }
  }

  ngOnInit(): void {
    this.cartService
      .getCart()
      .pipe(
        tap((data: CartType | DefaultResponseType) => {
          if ((data as DefaultResponseType).error !== undefined) {
            throw new Error((data as DefaultResponseType).message);
          }
          this.cart = data as CartType;
        }),

        switchMap(() => {
          if (this.authService.getIsLoggedIn()) {
            return this.favoriteService.getFavorite().pipe(
              tap((data: FavoriteType[] | DefaultResponseType) => {
                if ((data as DefaultResponseType).error !== undefined) {
                  throw new Error((data as DefaultResponseType).message);
                }
                this.favoriteProducts = data as FavoriteType[];
              }),
            );
          }
          return of(null);
        }),
      )
      .subscribe({
        next: () => {
          this.processCatalog();
        },
        error: (err) => {
          console.error(err);
          this.processCatalog();
        },
      });
  }

  processCatalog() {
    this.categoryService.getCategoriesWithType().subscribe((data) => {
      this.categoryWithTypes = data;

      this.activatedRoute.queryParams
        .pipe(
          tap(() => (this.isLoading = true)),
          debounceTime(300),
        )
        .subscribe((params) => {
          this.activeParams = ActiveParamsUtil.processParams(params);

          this.appliedFilters = [];

          this.activeParams.types.forEach((url) => {
            for (let i = 0; i < this.categoryWithTypes.length; i++) {
              const foundType = this.categoryWithTypes[i].types.find((type) => type.url === url);
              if (foundType) {
                this.appliedFilters.push({
                  name: foundType.name,
                  urlParam: foundType.url,
                });
              }
            }
          });

          if (this.activeParams.heightFrom) {
            this.appliedFilters.push({
              name: 'Высота: от ' + this.activeParams.heightFrom + ' см',
              urlParam: 'heightFrom',
            });
          }

          if (this.activeParams.heightTo) {
            this.appliedFilters.push({
              name: 'Высота: до ' + this.activeParams.heightTo + ' см',
              urlParam: 'heightTo',
            });
          }

          if (this.activeParams.diameterFrom) {
            this.appliedFilters.push({
              name: 'Диаметр: от ' + this.activeParams.diameterFrom + ' см',
              urlParam: 'diameterFrom',
            });
          }

          if (this.activeParams.diameterTo) {
            this.appliedFilters.push({
              name: 'Диаметр: до ' + this.activeParams.diameterTo + ' см',
              urlParam: 'diameterTo',
            });
          }

          this.productService.getProducts(this.activeParams).subscribe((data) => {
            this.pages = [];
            for (let i = 1; i <= data.pages; i++) {
              this.pages.push(i);
            }

            if (this.cart && this.cart.items.length > 0) {
              this.products = data.items.map((product) => {
                if (this.cart) {
                  const productInCart = this.cart.items.find(
                    (item) => item.product.id === product.id,
                  );

                  if (productInCart) {
                    product.countInCart = productInCart?.quantity;
                  }
                }

                return product;
              });
            } else {
              this.products = data.items;
            }

            if (this.favoriteProducts) {
              this.products = this.products.map((product) => {
                const productInFavorite = this.favoriteProducts?.find(
                  (item) => item.id === product.id,
                );
                if (productInFavorite) {
                  product.isInFavorite = true;
                }

                return product;
              });
            }

            this.isLoading = false;
            this.cdr.detectChanges();
          });
        });
    });
  }

  removeAppliedFilter(appliedFilter: AppliedFilterType) {
    if (
      appliedFilter.urlParam === 'heightFrom' ||
      appliedFilter.urlParam === 'heightTo' ||
      appliedFilter.urlParam === 'diameterFrom' ||
      appliedFilter.urlParam === 'diameterTo'
    ) {
      delete this.activeParams[appliedFilter.urlParam];
    } else {
      this.activeParams.types = this.activeParams.types.filter(
        (item) => item !== appliedFilter.urlParam,
      );
    }

    this.activeParams.page = 1;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams,
    });
  }

  toggleSorting(event: MouseEvent) {
    event.stopPropagation();
    this.sortingOpen = !this.sortingOpen;
  }

  sort(value: string) {
    this.activeParams.sort = value;

    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams,
    });
  }

  openPage(page: number) {
    this.activeParams.page = page;

    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams,
    });
  }

  openPrevPage() {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams,
      });
    }
  }
  openNextPage() {
    const currentPage = this.activeParams.page ?? 1;

    if (currentPage < this.pages.length) {
      this.activeParams.page = currentPage + 1;

      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams,
      });
    }
  }
}
