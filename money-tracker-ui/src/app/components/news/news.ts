import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  editingPostId: number | null = null;
  editTitle = '';
  editText = '';
  error = '';

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.api.getNews().subscribe({
      next: posts => {
        this.posts = posts;
        this.cdr.detectChanges();
      },
    });
  }

  publishPost() {
    if (!this.newPostTitle.trim() || !this.newPostText.trim()) return;
    this.error = '';
    this.api.createNews(this.newPostTitle, this.newPostText).subscribe({
      next: () => {
        this.newPostTitle = '';
        this.newPostText = '';
        this.loadNews();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Публиковать новости может только методист';
        this.cdr.detectChanges();
      },
    });
  }

  startEdit(post: NewsPost) {
    this.editingPostId = post.id;
    this.editTitle = post.title;
    this.editText = post.content;
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editTitle = '';
    this.editText = '';
  }

  saveEdit(post: NewsPost) {
    if (!this.editTitle.trim() || !this.editText.trim()) return;
    this.error = '';
    this.api.updateNews(post.id, this.editTitle, this.editText).subscribe({
      next: updated => {
        this.posts = this.posts.map(p => p.id === updated.id ? updated : p);
        this.cancelEdit();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Редактировать новости может только методист';
        this.cdr.detectChanges();
      },
    });
  }

  deletePost(post: NewsPost) {
    this.error = '';
    this.api.deleteNews(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Удалять новости может только методист';
        this.cdr.detectChanges();
      },
    });
  }
}
