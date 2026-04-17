import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-order-create',
  imports: [FormsModule, RouterLink, Sidebar],
  templateUrl: './order-create.html',
  styleUrl: './order-create.css'
})
export class OrderCreate {
  selectedFormat = 0;
  orderType = 'video';
  duration = 'До 30 минут';
  orderTitle = '';
  orderDetails = '';
  needsMontage = 'no';
  montageInstructions = '';
  error = '';
  showAuthPrompt = false;

  formats = [
    { icon: '🎬', label: 'Клип', desc: 'Музыкальное видео', value: 'video' },
    { icon: '🎙', label: 'Подкаст', desc: 'Интервью, разговоры', value: 'video' },
    { icon: '📸', label: 'Фотосессия', desc: 'Портреты, события', value: 'photo' },
  ];

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthService
  ) {}

  selectFormat(index: number) {
    this.selectedFormat = index;
    this.orderType = this.formats[index].value;
  }

  submit() {
    if (!this.orderTitle.trim()) {
      this.error = 'Укажите название заказа';
      return;
    }
    if (!this.auth.token) {
      this.error = '';
      this.showAuthPrompt = true;
      return;
    }
    this.error = '';
    this.showAuthPrompt = false;
    this.api.createOrder({
      title: this.orderTitle,
      description: this.orderDetails,
      service_type: this.orderType,
    }).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: () => this.error = 'Ошибка при создании заказа. Войдите в аккаунт.'
    });
  }
}
