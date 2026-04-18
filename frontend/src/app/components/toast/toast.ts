import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {
  toast = inject(ToastService);

  iconFor(kind: string): string {
    if (kind === 'success') return '✓';
    if (kind === 'error') return '!';
    return 'i';
  }
}
