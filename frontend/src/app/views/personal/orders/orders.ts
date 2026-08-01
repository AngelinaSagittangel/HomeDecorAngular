import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../shared/services/order.service';
import { OrderType } from '../../../../types/order.type';
import { DefaultResponseType } from '../../../../types/default-response.type';
import { OrderStatusUtil } from '../../../shared/utils/order-status.util';

@Component({
  selector: 'app-orders',
  imports: [RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  orders: OrderType[] = [];

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderService.getOrder().subscribe((data: OrderType[] | DefaultResponseType) => {
      if ((data as DefaultResponseType).error !== undefined) {
        throw new Error((data as DefaultResponseType).message);
      }

      this.orders = (data as OrderType[]).map(item => {

        const status = OrderStatusUtil.getStatusAnsColor(item.status);

        item.statusRus = status.name;
        item.color = status.color;

        return item;
      });
      this.cdr.detectChanges();
    });
  }
}
