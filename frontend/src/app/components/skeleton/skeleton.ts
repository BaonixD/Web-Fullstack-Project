import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  imports: [],
  template: `<span class="skeleton" [class.skeleton-circle]="shape === 'circle'"
                   [style.width]="width" [style.height]="height" [style.borderRadius]="radius"></span>`,
  styleUrl: './skeleton.css'
})
export class Skeleton {
  @Input() width = '100%';
  @Input() height = '16px';
  @Input() radius = '6px';
  @Input() shape: 'rect' | 'circle' = 'rect';
}

@Component({
  selector: 'app-skeleton-card',
  imports: [Skeleton],
  template: `
    <div class="skeleton-card">
      <div class="skeleton-card-top">
        <app-skeleton width="70px" height="22px" radius="6px" />
        <app-skeleton width="80px" height="22px" radius="6px" />
      </div>
      <app-skeleton width="75%" height="20px" />
      <app-skeleton width="100%" height="14px" />
      <app-skeleton width="90%" height="14px" />
      <div class="skeleton-card-bottom">
        <app-skeleton width="100px" height="14px" />
        <app-skeleton width="60px" height="14px" />
      </div>
    </div>
  `,
  styleUrl: './skeleton.css'
})
export class SkeletonCard {}
