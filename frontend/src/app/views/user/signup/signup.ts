import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { CommonModule } from '@angular/common';
import { RepeatPasswordDirective } from '../../../shared/directives/repeat-password';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { LoginResponseType } from '../../../../types/login-response.type';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signup',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CommonModule,
    RepeatPasswordDirective,
    MatSnackBarModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private _snackBar = inject(MatSnackBar);
  signUpForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.signUpForm = this.fb.group({
      email: ['', [Validators.email, Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/),
        ],
      ],
      repeatPassword: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/),
        ],
      ],
      agree: [false, [Validators.requiredTrue]],
    });
  }

  signUp() {
    if (
      this.signUpForm.valid &&
      this.signUpForm.value.email &&
      this.signUpForm.value.password &&
      this.signUpForm.value.repeatPassword &&
      this.signUpForm.value.agree
    ) {
      this.authService
        .signUp(
          this.signUpForm.value.email,
          this.signUpForm.value.password,
          this.signUpForm.value.repeatPassword,
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

            this._snackBar.open('Вы успешно зарегестрировались!', undefined, { duration: 2500 });
            this.router.navigate(['']);
          },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message, undefined, { duration: 2500 });
            } else {
              this._snackBar.open('Ошибка регистрации!', undefined, { duration: 2500 });
            }
          },
        });
    }
  }
}
