import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolver?: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  state = signal<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    tone: 'default',
  });

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.state.set({
        open: true,
        title: options.title,
        message: options.message ?? '',
        confirmText: options.confirmText ?? 'Подтвердить',
        cancelText: options.cancelText ?? 'Отмена',
        tone: options.tone ?? 'default',
        resolver: resolve,
      });
    });
  }

  confirm() {
    const s = this.state();
    s.resolver?.(true);
    this.close();
  }

  cancel() {
    const s = this.state();
    s.resolver?.(false);
    this.close();
  }

  private close() {
    this.state.update(s => ({ ...s, open: false, resolver: undefined }));
  }
}
