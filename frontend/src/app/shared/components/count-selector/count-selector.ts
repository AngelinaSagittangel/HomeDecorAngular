import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'count-selector',
  imports: [FormsModule],
  templateUrl: './count-selector.html',
  styleUrl: './count-selector.scss',
})
export class CountSelector {
  @Input() count: number = 0;
  @Output() onChangeCount: EventEmitter<number> = new EventEmitter<number>();

  countChange() {
    this.onChangeCount.emit(this.count);
  }

  decreaseCount() {
    if (this.count >= 1) {
      this.count--;
      this.countChange();
    }
  }
  increaseCount() {
    this.count++;
    this.countChange();
  }
}
