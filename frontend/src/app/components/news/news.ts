import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Sidebar } from '../sidebar/sidebar';
import { Skeleton } from '../skeleton/skeleton';
import { ApiService, NewsPost, NewsMedia } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-news',
  imports: [FormsModule, DatePipe, Sidebar, Skeleton],
  templateUrl: './news.html',
  styleUrl: './news.css'
})
export class News implements OnInit {
  newPostTitle = '';
  newPostText = '';
  posts: NewsPost[] = [];
  loading = true;
  editingPostId: number | null = null;
  editTitle = '';
  editText = '';

  // Media picker for new post
  pendingFiles: File[] = [];
  pendingPreviews: { url: string; kind: 'image' | 'video'; name: string }[] = [];

  // Media picker for edit mode
  editNewFiles: File[] = [];
  editNewPreviews: { url: string; kind: 'image' | 'video'; name: string }[] = [];
  editRemoveIds: number[] = [];

  // Lightbox
  lightboxMedia: NewsMedia | null = null;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadNews();
  }

  loadNews() {
    this.loading = true;
    this.api.getNews().subscribe({
      next: posts => {
        this.posts = posts;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Не удалось загрузить новости');
        this.cdr.detectChanges();
      },
    });
  }

  publishPost() {
    if (!this.newPostTitle.trim() || !this.newPostText.trim()) return;
    this.api.createNews(this.newPostTitle, this.newPostText, this.pendingFiles).subscribe({
      next: () => {
        this.newPostTitle = '';
        this.newPostText = '';
        this.clearPendingMedia();
        this.toast.success('Новость опубликована');
        this.loadNews();
      },
      error: () => this.toast.error('Публиковать новости может только методист'),
    });
  }

  onMediaPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    for (const file of files) {
      const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      const url = URL.createObjectURL(file);
      this.pendingFiles.push(file);
      this.pendingPreviews.push({ url, kind, name: file.name });
    }
    input.value = '';
  }

  removePending(index: number) {
    const preview = this.pendingPreviews[index];
    if (preview) URL.revokeObjectURL(preview.url);
    this.pendingFiles.splice(index, 1);
    this.pendingPreviews.splice(index, 1);
  }

  private clearPendingMedia() {
    for (const p of this.pendingPreviews) URL.revokeObjectURL(p.url);
    this.pendingFiles = [];
    this.pendingPreviews = [];
  }

  startEdit(post: NewsPost) {
    this.editingPostId = post.id;
    this.editTitle = post.title;
    this.editText = post.content;
    this.clearEditMedia();
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editTitle = '';
    this.editText = '';
    this.clearEditMedia();
  }

  onEditMediaPick(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    for (const file of files) {
      const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      const url = URL.createObjectURL(file);
      this.editNewFiles.push(file);
      this.editNewPreviews.push({ url, kind, name: file.name });
    }
    input.value = '';
  }

  removeEditNew(index: number) {
    const preview = this.editNewPreviews[index];
    if (preview) URL.revokeObjectURL(preview.url);
    this.editNewFiles.splice(index, 1);
    this.editNewPreviews.splice(index, 1);
  }

  toggleRemoveExisting(mediaId: number) {
    const idx = this.editRemoveIds.indexOf(mediaId);
    if (idx >= 0) this.editRemoveIds.splice(idx, 1);
    else this.editRemoveIds.push(mediaId);
  }

  isMarkedForRemoval(mediaId: number): boolean {
    return this.editRemoveIds.includes(mediaId);
  }

  private clearEditMedia() {
    for (const p of this.editNewPreviews) URL.revokeObjectURL(p.url);
    this.editNewFiles = [];
    this.editNewPreviews = [];
    this.editRemoveIds = [];
  }

  saveEdit(post: NewsPost) {
    if (!this.editTitle.trim() || !this.editText.trim()) return;
    this.api.updateNews(post.id, this.editTitle, this.editText, this.editNewFiles, this.editRemoveIds).subscribe({
      next: updated => {
        this.posts = this.posts.map(p => p.id === updated.id ? updated : p);
        this.cancelEdit();
        this.toast.success('Новость обновлена');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Редактировать новости может только методист'),
    });
  }

  isEdited(post: NewsPost): boolean {
    if (!post.updated_at) return false;
    const created = new Date(post.created_at).getTime();
    const updated = new Date(post.updated_at).getTime();
    // guard against microsecond-level drift from auto_now on creation
    return updated - created > 2000;
  }

  openLightbox(media: NewsMedia) {
    this.lightboxMedia = media;
  }

  closeLightbox() {
    this.lightboxMedia = null;
  }

  async deletePost(post: NewsPost) {
    const ok = await this.confirm.ask({
      title: 'Удалить новость?',
      message: `Новость «${post.title}» будет удалена.`,
      confirmText: 'Удалить',
      tone: 'danger',
    });
    if (!ok) return;
    this.api.deleteNews(post.id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p.id !== post.id);
        this.toast.info('Новость удалена');
        this.cdr.detectChanges();
      },
      error: () => this.toast.error('Удалять новости может только методист'),
    });
  }

  skeletonPlaceholders(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
