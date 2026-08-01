import { Routes } from '@angular/router';
import { Layout } from './shared/layout/layout';
import { Main } from './views/main/main';
import { authForwardGuard } from './core/auth/auth-forward-guard';
import { authGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        component: Main,
      },
      {
        path: 'login',
        loadComponent: () => import('./views/user/login/login').then((m) => m.Login),
        canActivate: [authForwardGuard],
      },
      {
        path: 'signup',
        loadComponent: () => import('./views/user/signup/signup').then((m) => m.Signup),
      },
      {
        path: 'catalog',
        loadComponent: () => import('./views/product/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'product/:url',
        loadComponent: () => import('./views/product/detail/detail').then((m) => m.Detail),
      },
      {
        path: 'order',
        loadComponent: () => import('./views/order/order/order').then((m) => m.Order),
      },
      {
        path: 'cart',
        loadComponent: () => import('./views/order/cart/cart').then((m) => m.Cart),
      },
      {
        path: 'favorites',
        loadComponent: () => import('./views/personal/favorite/favorites').then((m) => m.Favorites),
        canActivate: [authGuard],
      },
      {
        path: 'info',
        loadComponent: () => import('./views/personal/info/info').then((m) => m.Info),
        canActivate: [authGuard],
      },
      {
        path: 'orders',
        loadComponent: () => import('./views/personal/orders/orders').then((m) => m.Orders),
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
