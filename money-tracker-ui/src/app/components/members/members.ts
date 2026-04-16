import { Component, OnInit } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, Member } from '../../services/api.service';

@Component({
  selector: 'app-members',
  imports: [Sidebar],
  templateUrl: './members.html',
  styleUrl: './members.css'
})
export class Members implements OnInit {
  members: Member[] = [];

  private gradients = [
    'linear-gradient(135deg,#a29bfe,#6c5ce7)',
    'linear-gradient(135deg,#fd79a8,#e84393)',
    'linear-gradient(135deg,#00cec9,#0984e3)',
    'linear-gradient(135deg,#ffeaa7,#f39c12)',
    'linear-gradient(135deg,#55efc4,#00b894)',
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getMembers().subscribe({
      next: members => this.members = members,
    });
  }

  getInitials(m: Member): string {
    if (m.first_name && m.last_name) {
      return (m.first_name[0] + m.last_name[0]).toUpperCase();
    }
    return m.username.substring(0, 2).toUpperCase();
  }

  getDisplayName(m: Member): string {
    if (m.first_name && m.last_name) {
      return `${m.first_name} ${m.last_name}`;
    }
    return m.username;
  }

  getGradient(index: number): string {
    return this.gradients[index % this.gradients.length];
  }
}
