import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

// Cách báo cho người nhà: 'stage' xong một giai đoạn (âm báo ngắn),
// 'final' ca kết thúc (chuông + rung tới khi tắt), 'info' thay đổi khác
export type NotifyAlert = 'stage' | 'final' | 'info';

export type AppEvent =
  | { type: 'surgery.updated'; surgeryId: string }
  | {
      type: 'notification.created';
      userId: string;
      surgeryId: string;
      alert: NotifyAlert;
    };

// Bus sự kiện trong bộ nhớ; chạy nhiều instance cần chuyển sang Redis pub/sub
@Injectable()
export class EventsService {
  private readonly subject = new Subject<AppEvent>();

  emit(event: AppEvent): void {
    this.subject.next(event);
  }

  get stream(): Observable<AppEvent> {
    return this.subject.asObservable();
  }
}
