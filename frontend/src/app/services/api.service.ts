import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Order {
  id?: number;
  title: string;
  description: string;
  service_type: string;
  status: string;
  customer?: number;
  customer_name?: string;
  executor?: number | null;
  executor_name?: string | null;
  cover_url?: string | null;
  deadline?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at?: string;
}

export interface OrderStatusLog {
  id: number;
  order: number;
  actor: number | null;
  actor_name: string | null;
  from_status: string;
  to_status: string;
  created_at: string;
}

export interface NewsMedia {
  id: number;
  url: string;
  kind: 'image' | 'video';
  order: number;
}

export interface NewsPost {
  id: number;
  title: string;
  content: string;
  author?: number;
  author_name?: string;
  author_role?: string;
  created_at: string;
  updated_at?: string;
  media?: NewsMedia[];
}

export interface Member {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  avatar_url?: string | null;
}

export interface MemberDetail extends Member {
  active_orders: number;
  completed_orders: number;
  orders: Order[];
}

export interface InterviewRequest {
  id: number;
  applicant: number;
  applicant_name: string;
  applicant_email: string;
  applicant_full_name: string;
  portfolio_link: string;
  status: string;
  feedback: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  order: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  text: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  kind: string;
  text: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Orders
  getOrders() { return this.http.get<Order[]>('/api/orders/'); }
  getOrder(id: number) { return this.http.get<Order>(`/api/orders/${id}/`); }
  createOrder(order: Partial<Order> | FormData) {
    return this.http.post<Order>('/api/orders/', order);
  }
  updateOrder(id: number, data: Partial<Order>) {
    return this.http.put<Order>(`/api/orders/${id}/`, data);
  }
  deleteOrder(id: number) { return this.http.delete(`/api/orders/${id}/`); }
  getOrderMessages(orderId: number) {
    return this.http.get<ChatMessage[]>(`/api/orders/${orderId}/messages/`);
  }
  sendOrderMessage(orderId: number, form: FormData) {
    return this.http.post<ChatMessage>(`/api/orders/${orderId}/messages/`, form);
  }
  getOrderStatusLog(orderId: number) {
    return this.http.get<OrderStatusLog[]>(`/api/orders/${orderId}/status-log/`);
  }

  // News
  getNews() { return this.http.get<NewsPost[]>('/api/news/'); }
  createNews(title: string, content: string, media: File[] = []) {
    const form = new FormData();
    form.append('title', title);
    form.append('content', content);
    for (const file of media) form.append('media', file);
    return this.http.post<NewsPost>('/api/news/', form);
  }
  updateNews(id: number, title: string, content: string, newMedia: File[] = [], removeMediaIds: number[] = []) {
    const form = new FormData();
    form.append('title', title);
    form.append('content', content);
    for (const file of newMedia) form.append('media', file);
    for (const rid of removeMediaIds) form.append('remove_media', String(rid));
    return this.http.put<NewsPost>(`/api/news/${id}/`, form);
  }
  deleteNews(id: number) { return this.http.delete(`/api/news/${id}/`); }

  // Members
  getMembers() { return this.http.get<Member[]>('/api/members/'); }
  getMember(id: number) { return this.http.get<MemberDetail>(`/api/members/${id}/`); }
  removeMember(id: number) { return this.http.delete(`/api/members/${id}/`); }

  // Interviews
  getInterviews() { return this.http.get<InterviewRequest[]>('/api/interviews/'); }
  createInterview(portfolioLink: string) {
    return this.http.post<InterviewRequest>('/api/interviews/', { portfolio_link: portfolioLink });
  }
  approveInterview(id: number, payload: { feedback?: string; department?: string } = {}) {
    return this.http.post<InterviewRequest>(`/api/interviews/${id}/approve/`, payload);
  }
  rejectInterview(id: number, feedback = '') {
    return this.http.post<InterviewRequest>(`/api/interviews/${id}/reject/`, { feedback });
  }

  // Notifications
  getNotifications() {
    return this.http.get<NotificationsResponse>('/api/notifications/');
  }
  markNotificationRead(id: number) {
    return this.http.post<Notification>(`/api/notifications/${id}/read/`, {});
  }
  markAllNotificationsRead() {
    return this.http.post<{ ok: boolean }>('/api/notifications/read-all/', {});
  }

  // User avatar
  uploadAvatar(form: FormData) {
    return this.http.patch('/api/me/', form);
  }
}
