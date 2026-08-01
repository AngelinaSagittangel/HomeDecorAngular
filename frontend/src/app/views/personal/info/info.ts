import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaymentType } from '../../../../types/payment.type';
import { DeliveryType } from '../../../../types/delivery.type';
import { UserService } from '../../../shared/services/user.service';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { UserInfoType } from '../../../../types/user-info.type';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-info',
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './info.html',
  styleUrl: './info.scss',
})
export class Info implements OnInit {
  private fb = inject(FormBuilder);
  deliveryType: DeliveryType = DeliveryType.delivery;
  deliveryTypes = DeliveryType;
  paymentTypes = PaymentType;
  private _snackBar = inject(MatSnackBar);

  userInfoForm = this.fb.group({
    firstName: [''],
    lastName: [''],
    fatherName: [''],
    phone: [''],
    paymentType: [PaymentType.cashToCourier],
    email: ['', Validators.required],
    street: [''],
    house: [''],
    entrance: [''],
    apartment: [''],
  });

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfo().subscribe((data: UserInfoType | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        throw new Error((data as DefaultResponseType).message);
      }

      const userInfo = data as UserInfoType;

      const paramsToUpdate = {
        firstName: userInfo.firstName ? userInfo.firstName : '',
        lastName: userInfo.lastName ? userInfo.lastName : '',
        fatherName: userInfo.fatherName ? userInfo.fatherName : '',
        phone: userInfo.phone ? userInfo.phone : '',
        paymentType: userInfo.paymentType ? userInfo.paymentType : PaymentType.cashToCourier,
        email: userInfo.email ? userInfo.email : '',
        street: userInfo.street ? userInfo.street : '',
        house: userInfo.house ? userInfo.house : '',
        entrance: userInfo.entrance ? userInfo.entrance : '',
        apartment: userInfo.apartment ? userInfo.apartment : '',
      };

      this.userInfoForm.setValue(paramsToUpdate);
      if (userInfo.deliveryType) {
        this.deliveryType = userInfo.deliveryType;
      }
      this.cdr.detectChanges();
    });
  }

  changeDeliveryType(deliveryType: DeliveryType) {
    this.deliveryType = deliveryType;

    this.userInfoForm.markAsDirty();
  }

  updateUserInfo() {
    if (this.userInfoForm.valid) {
      const paramObject: UserInfoType = {
        email: this.userInfoForm.value.email ? this.userInfoForm.value.email : '',
        deliveryType: this.deliveryType,
        paymentType: this.userInfoForm.value.paymentType
          ? this.userInfoForm.value.paymentType
          : PaymentType.cashToCourier,
      };

      if (this.userInfoForm.value.firstName) {
        paramObject.firstName = this.userInfoForm.value.firstName;
      }
      if (this.userInfoForm.value.lastName) {
        paramObject.lastName = this.userInfoForm.value.lastName;
      }
      if (this.userInfoForm.value.fatherName) {
        paramObject.fatherName = this.userInfoForm.value.fatherName;
      }
      if (this.userInfoForm.value.phone) {
        paramObject.phone = this.userInfoForm.value.phone;
      }
      if (this.userInfoForm.value.street) {
        paramObject.street = this.userInfoForm.value.street;
      }
      if (this.userInfoForm.value.house) {
        paramObject.house = this.userInfoForm.value.house;
      }
      if (this.userInfoForm.value.entrance) {
        paramObject.entrance = this.userInfoForm.value.entrance;
      }
      if (this.userInfoForm.value.apartment) {
        paramObject.apartment = this.userInfoForm.value.apartment;
      }
      this.userService.updateUserInfo(paramObject).subscribe({
        next: (data: DefaultResponseType) => {
          if (data.error) {
            this._snackBar.open(data.message, undefined, {
              duration: 2500,
            });
            throw new Error(data.message);
          }

          this._snackBar.open('Данные успешно сохранены', undefined, {
            duration: 2500,
          });
          this.userInfoForm.markAsPristine();
        },
        error: (error: HttpErrorResponse) => {
          if (error.error && error.error.message) {
            this._snackBar.open(error.error.message, undefined, {
              duration: 2500,
            });
          } else {
            this._snackBar.open('Ошибка добавления данных', undefined, {
              duration: 2500,
            });
          }
        },
      });
    }
  }
}
