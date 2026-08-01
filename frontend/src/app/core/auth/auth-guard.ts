import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const _snackBar = inject(MatSnackBar);

  const isLoggedIn = authService.getIsLoggedIn();

  if (!isLoggedIn) {
    _snackBar.open('Необходимо авторизоваться!', undefined, { duration: 2500 });
  }

  return isLoggedIn;
};
