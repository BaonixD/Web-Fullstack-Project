import { Component, ElementRef, OnDestroy, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, ChatMessage, Order, Member, OrderStatusLog } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, FormsModule, DatePipe, Sidebar],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessagesRef?: ElementRef<HTMLDivElement>;

  order: Order | null = null;
  members: Member[] = [];
  messages: ChatMessage[] = [];
  statusLog: OrderStatusLog[] = [];
  assignTo: number | null = null;
  newStatus = '';
  chatText = '';
  chatFile: File | null = null;
  coverBroken = false;

  isCoverVideo(url: string | null | undefined): boolean {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
  }
  chatConnected = false;
  error = '';
  success = '';
  private socket: WebSocket | null = null;

  statuses = [
    { value: 'pending', label: 'Ожидает' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Готово' },
  ];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    private confirm: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.api.getOrder(id).subscribe({
        next: order => {
          this.order = order;
          this.assignTo = order.executor ?? null;
          this.newStatus = order.status;
          this.loadMessages(order.id!);
          this.loadStatusLog(order.id!);
          this.connectChat(order.id!);
          this.cdr.detectChanges();
        },
        error: () => this.error = 'Заказ не найден'
      });
    }
    this.api.getMembers().subscribe({
      next: members => {
        this.members = members;
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy() {
    this.socket?.close();
  }

  assignOrder() {
    if (!this.order?.id) return;
    this.api.updateOrder(this.order.id, { executor: this.assignTo }).subscribe({
      next: order => {
        this.order = order;
        this.toast.success('Исполнитель назначен');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Ошибка назначения исполнителя')
    });
  }

  changeStatus() {
    if (!this.order?.id || this.newStatus === this.order.status) return;
    this.api.updateOrder(this.order.id, { status: this.newStatus }).subscribe({
      next: order => {
        this.order = order;
        this.toast.success('Статус обновлён');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Ошибка обновления статуса')
    });
  }

  async deleteOrder() {
    if (!this.order?.id) return;
    const ok = await this.confirm.ask({
      title: 'Удалить заказ?',
      message: `Заказ «${this.order.title}» будет удалён навсегда вместе с историей чата.`,
      confirmText: 'Удалить',
      tone: 'danger',
    });
    if (!ok) return;
    this.api.deleteOrder(this.order.id).subscribe({
      next: () => {
        this.toast.success('Заказ удалён');
        this.router.navigate(['/profile']);
      },
      error: () => this.toast.error('Ошибка удаления заказа')
    });
  }

  canDeleteOrder(): boolean {
    const user = this.auth.user();
    if (!user || !this.order) return false;
    return user.role === 'methodist' || this.order.customer === user.id;
  }

  private showSuccess(msg: string) {
    this.success = msg;
    this.cdr.detectChanges();
    setTimeout(() => { this.success = ''; this.cdr.detectChanges(); }, 3000);
  }

  loadMessages(orderId: number) {
    this.api.getOrderMessages(orderId).subscribe({
      next: messages => {
        this.messages = messages;
        this.cdr.detectChanges();
        this.scrollChatToBottom();
      },
      error: () => {
        this.messages = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadStatusLog(orderId: number) {
    this.api.getOrderStatusLog(orderId).subscribe({
      next: logs => {
        this.statusLog = logs;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statusLog = [];
      }
    });
  }

  onChatFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.chatFile = input.files?.[0] || null;
    this.cdr.detectChanges();
  }

  clearChatFile() {
    this.chatFile = null;
    this.cdr.detectChanges();
  }

  deadlineInfo(): { label: string; tone: 'ok' | 'warn' | 'overdue' } | null {
    if (!this.order?.deadline) return null;
    const deadline = new Date(this.order.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = deadline.getTime() - today.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `Просрочен на ${Math.abs(days)} дн.`, tone: 'overdue' };
    if (days === 0) return { label: 'Срок — сегодня', tone: 'warn' };
    if (days <= 3) return { label: `Осталось ${days} дн.`, tone: 'warn' };
    return { label: `Осталось ${days} дн.`, tone: 'ok' };
  }

  connectChat(orderId: number) {
    if (!this.auth.token) return;
    this.socket?.close();
    const token = encodeURIComponent(this.auth.token);
    this.socket = new WebSocket(`ws://127.0.0.1:8000/ws/orders/${orderId}/chat/?token=${token}`);

    this.socket.onopen = () => {
      this.chatConnected = true;
      this.cdr.detectChanges();
    };
    this.socket.onclose = () => {
      this.chatConnected = false;
      this.cdr.detectChanges();
    };
    this.socket.onerror = () => {
      this.chatConnected = false;
      this.cdr.detectChanges();
    };
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data) as ChatMessage;
      if (!this.messages.some(m => m.id === message.id)) {
        this.messages = [...this.messages, message];
      }
      this.cdr.detectChanges();
      this.scrollChatToBottom();
    };
  }

  sendMessage() {
    if (!this.order?.id) return;
    const text = this.chatText.trim();
    if (!text && !this.chatFile) return;

    // If a file is attached, send via REST (multipart)
    if (this.chatFile) {
      const form = new FormData();
      if (text) form.append('text', text);
      form.append('attachment', this.chatFile);
      this.api.sendOrderMessage(this.order.id, form).subscribe({
        next: msg => {
          if (!this.messages.some(m => m.id === msg.id)) {
            this.messages = [...this.messages, msg];
          }
          this.chatText = '';
          this.chatFile = null;
          this.cdr.detectChanges();
          this.scrollChatToBottom();
        },
        error: () => this.toast.error('Не удалось отправить сообщение')
      });
      return;
    }

    // Otherwise use WebSocket for plain text
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ text }));
    this.chatText = '';
    this.cdr.detectChanges();
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.sender === this.auth.user()?.id;
  }

  private scrollChatToBottom() {
    setTimeout(() => {
      const el = this.chatMessagesRef?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  getTypeLabel(type: string): string {
    if (type === 'video') return 'Видеосъёмка';
    if (type === 'photo') return 'Фотосъёмка';
    return 'Дизайн';
  }

  getStatusLabel(status: string): string {
    if (status === 'pending') return 'Ожидает';
    if (status === 'in_progress') return 'В работе';
    return 'Готово';
  }

  getStatusClass(status: string): string {
    if (status === 'pending') return 'status-pending';
    if (status === 'in_progress') return 'status-progress';
    return 'status-done';
  }

  getMemberName(m: Member): string {
    if (m.first_name && m.last_name) return `${m.first_name} ${m.last_name}`;
    return m.username;
  }
}
