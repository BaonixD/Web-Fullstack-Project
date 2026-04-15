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
  created_at?: string;
}

export interface NewsPost {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Orders
  getOrders() {
    return this.http.get<Order[]>('/api/orders/');
  }

  getOrder(id: number) {
    return this.http.get<Order>(`/api/orders/${id}/`);
  }

  createOrder(order: Partial<Order>) {
    return this.http.post<Order>('/api/orders/', order);
  }

  updateOrder(id: number, order: Partial<Order>) {
    return this.http.put<Order>(`/api/orders/${id}/`, order);
  }

  deleteOrder(id: number) {
    return this.http.delete(`/api/orders/${id}/`);
  }

  // News
  getNews() {
    return this.http.get<NewsPost[]>('/api/news/');
  }
}
