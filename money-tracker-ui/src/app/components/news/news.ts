import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, NewsPost } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-news',
  imports: [FormsModule, DatePipe, Sidebar],
  templateUrl: './news.html',
  styleUrl: './news.css'
})
export class News implements OnInit {
  newPostTitle = '';
  newPostText = '';
  posts: NewsPost[] = [];

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.api.getNews().subscribe({
      next: posts => this.posts = posts,
    });
  }

  publishPost() {
    if (!this.newPostTitle.trim() || !this.newPostText.trim()) return;
    this.api.createNews(this.newPostTitle, this.newPostText).subscribe({
      next: () => {
        this.newPostTitle = '';
        this.newPostText = '';
        this.loadNews();
      }
    });
  }
}
