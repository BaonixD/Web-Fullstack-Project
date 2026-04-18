import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './components/toast/toast';
import { Confirm } from './components/confirm/confirm';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private theme = inject(ThemeService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  constructor() {
    effect(() => {
      if (this.auth.user()) {
        this.notifications.start();
      } else {
        this.notifications.stop();
      }
    });
  }
}
