import { Component, Input, OnInit } from '@angular/core';
import { CategoryWithTypeType } from '../../../../types/category-with-type.type';
import { ActivatedRoute, Router } from '@angular/router';
import { ActiveParamsType } from '../../../../types/active-params.type';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActiveParamsUtil } from '../../utils/active-params.util';

@Component({
  selector: 'category-filter',
  imports: [CommonModule, FormsModule],
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss',
})
export class CategoryFilter implements OnInit {
  @Input() categoryWithType: CategoryWithTypeType | null = null;
  @Input() type: string | null = null;
  open = false;
  activeParams: ActiveParamsType = { types: [] };

  from: number | null = null;
  to: number | null = null;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.activeParams = ActiveParamsUtil.processParams(params);

      if (this.type) {
        if (this.type === 'height') {
          if (this.activeParams.heightFrom || this.activeParams.heightTo) {
            this.open = true;
          } else {
            this.open = false;
          }

          this.to = this.activeParams.heightTo ? +this.activeParams.heightTo : null;
          this.from = this.activeParams.heightFrom ? +this.activeParams.heightFrom : null;

          if (this.activeParams.heightFrom) {
            this.from = +this.activeParams.heightFrom;
          }
          if (this.activeParams.heightTo) {
            this.to = +this.activeParams.heightTo;
          }
        } else if (this.type === 'diameter') {
          if (this.activeParams.diameterFrom || this.activeParams.diameterTo) {
            this.open = true;
          } else {
            this.open = false;
          }

          this.to = this.activeParams.diameterTo ? +this.activeParams.diameterTo : null;
          this.from = this.activeParams.diameterFrom ? +this.activeParams.diameterFrom : null;

          if (this.activeParams.diameterFrom) {
            this.from = +this.activeParams.diameterFrom;
          }
          if (this.activeParams.diameterTo) {
            this.to = +this.activeParams.diameterTo;
          }
        }
      } else {
        const urlTypes = Array.isArray(params['types'])
          ? params['types']
          : params['types']
            ? [params['types']]
            : [];

        if (
          this.categoryWithType &&
          this.categoryWithType.types &&
          this.categoryWithType.types.length > 0
        ) {
          const hasMatch = this.categoryWithType.types.some((type) =>
            urlTypes.find((item) => type.url === item),
          );

          if (hasMatch) {
            this.open = true;
          } else {
            this.open = false;
          }
        }
      }
    });
  }

  get title(): string {
    if (this.categoryWithType) {
      return this.categoryWithType.name;
    } else if (this.type) {
      if (this.type === 'height') {
        return 'Высота';
      } else if (this.type === 'diameter') {
        return 'Диаметр';
      }
    }

    return '';
  }

  toggle(): void {
    this.open = !this.open;
  }

  updateFilterParam(url: string, checked: boolean) {
    if (this.activeParams.types && this.activeParams.types.length > 0) {
      const existingTypeInParams = this.activeParams.types.find((item) => item === url);
      if (existingTypeInParams && !checked) {
        this.activeParams.types = this.activeParams.types.filter((item) => item !== url);
      } else if (!existingTypeInParams && checked) {
        this.activeParams.types = [...this.activeParams.types, url];
      }
    } else if (checked) {
      this.activeParams.types = [url];
    }

    this.activeParams.page = 1;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams,
    });
  }

  updateFilterParamFromTo(param: string, value: string) {
    if (
      param === 'heightFrom' ||
      param === 'heightTo' ||
      param === 'diameterFrom' ||
      param === 'diameterTo'
    ) {
      if (this.activeParams[param] && !value) {
        delete this.activeParams[param];
      } else {
        this.activeParams[param] = value;
      }

      this.activeParams.page = 1;
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams,
      });
    }
  }
}
