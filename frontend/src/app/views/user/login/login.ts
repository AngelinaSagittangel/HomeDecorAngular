import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { LoginResponseType } from '../../../../types/login-response.type';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, CommonModule, MatSnackBarModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private _snackBar = inject(MatSnackBar);
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {}
  login(): void {
    if (this.loginForm.valid && this.loginForm.value.email && this.loginForm.value.password) {
      this.authService
        .login(
          this.loginForm.value.email,
          this.loginForm.value.password,
          !!this.loginForm.value.rememberMe,
        )
        .subscribe({
          next: (data: DefaultResponseType | LoginResponseType) => {
            let error = '';
            if ((data as DefaultResponseType).error !== undefined) {
              error = (data as DefaultResponseType).message;
            }
            if (
              !(data as LoginResponseType).accessToken ||
              !(data as LoginResponseType).refreshToken ||
              !(data as LoginResponseType).userId
            ) {
              error = (data as DefaultResponseType).message;
            }

            if (error) {
              this._snackBar.open(error, undefined, { duration: 2500 });
              throw new Error(error);
            }

            this.authService.setTokens(
              (data as LoginResponseType).accessToken,
              (data as LoginResponseType).refreshToken,
            );

            this.authService.userId = (data as LoginResponseType).userId;

            this._snackBar.open('Вы успешно авторизовались!', undefined, { duration: 2500 });
            this.router.navigate(['']);
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message, undefined, { duration: 2500 });
            } else {
              this._snackBar.open('Ошибка авторизации!', undefined, { duration: 2500 });
            }
          },
        });
    }
  }
}
