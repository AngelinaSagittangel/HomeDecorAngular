import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { RouterOutlet } from '@angular/router';
import { CategoryService } from '../services/category.service';
import { CategoryWithTypeType } from '../../../types/category-with-type.type';

@Component({
  selector: 'app-layout',
  imports: [Header, Footer, RouterOutlet],
  templateUrl: './layout.html',
})
export class Layout implements OnInit {
  categories: CategoryWithTypeType[] = [];

  constructor(
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    this.categoryService.getCategoriesWithType().subscribe((category: CategoryWithTypeType[]) => {
      this.categories = category.map((item) => {
        return Object.assign(
          {
            typesURL: item.types.map((item) => item.url),
          },
          item,
        );
      });
      this.cdr.detectChanges();
    });
  }
}
