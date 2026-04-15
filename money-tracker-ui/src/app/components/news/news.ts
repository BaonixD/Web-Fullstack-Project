import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { ApiService, NewsPost } from '../../services/api.service';

@Component({
  selector: 'app-news',
  imports: [FormsModule, DatePipe, Sidebar],
  templateUrl: './news.html',
  styleUrl: './news.css'
})
export class News implements OnInit {
  newPostText = '';
  posts: NewsPost[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getNews().subscribe({
      next: posts => this.posts = posts,
    });
  }
}
