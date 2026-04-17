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
  created_at?: string;
}

export interface NewsPost {
  id: number;
  title: string;
  content: string;
  author?: number;
  author_name?: string;
  author_role?: string;
  created_at: string;
}

export interface Member {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
}

export interface InterviewRequest {
  id: number;
  applicant: number;
  applicant_name: string;
  applicant_email: string;
  applicant_full_name: string;
  portfolio_link: string;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  order: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  text: string;
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

  updateOrder(id: number, data: Partial<Order>) {
    return this.http.put<Order>(`/api/orders/${id}/`, data);
  }

  deleteOrder(id: number) {
    return this.http.delete(`/api/orders/${id}/`);
  }

  getOrderMessages(orderId: number) {
    return this.http.get<ChatMessage[]>(`/api/orders/${orderId}/messages/`);
  }

  // News
  getNews() {
    return this.http.get<NewsPost[]>('/api/news/');
  }

  createNews(title: string, content: string) {
    return this.http.post<NewsPost>('/api/news/', { title, content });
  }

  updateNews(id: number, title: string, content: string) {
    return this.http.put<NewsPost>(`/api/news/${id}/`, { title, content });
  }

  deleteNews(id: number) {
    return this.http.delete(`/api/news/${id}/`);
  }

  // Members
  getMembers() {
    return this.http.get<Member[]>('/api/members/');
  }

  removeMember(id: number) {
    return this.http.delete(`/api/members/${id}/`);
  }

  // Interviews
  getInterviews() {
    return this.http.get<InterviewRequest[]>('/api/interviews/');
  }

  createInterview(portfolioLink: string) {
    return this.http.post<InterviewRequest>('/api/interviews/', { portfolio_link: portfolioLink });
  }

  approveInterview(id: number) {
    return this.http.post<InterviewRequest>(`/api/interviews/${id}/approve/`, {});
  }

  rejectInterview(id: number) {
    return this.http.post<InterviewRequest>(`/api/interviews/${id}/reject/`, {});
  }
}
