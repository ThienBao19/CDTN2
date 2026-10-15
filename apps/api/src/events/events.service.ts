import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type AppEvent =
  | { type: 'surgery.updated'; surgeryId: string }
  | { type: 'notification.created'; userId: string; surgeryId: string };

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
