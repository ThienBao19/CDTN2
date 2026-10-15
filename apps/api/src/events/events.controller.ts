import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { from, interval, map, merge, mergeMap, Observable, of } from 'rxjs';
import { SurgeryAccessService } from '../access/surgery-access.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { eventVisibility } from './event-filter';
import { AppEvent, EventsService } from './events.service';

const HEARTBEAT_MS = 25_000;

// Mục 11.2: đẩy trạng thái mới tới màn hình đang mở (Server-Sent Events)
@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly access: SurgeryAccessService,
  ) {}

  @Sse()
  @SkipThrottle()
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    const visible = this.events.stream.pipe(
      mergeMap((event) => this.allowed(user, event)),
      map((event): MessageEvent => ({ type: event.type, data: event })),
    );
    const heartbeat = interval(HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: '' })),
    );
    return merge(visible, heartbeat);
  }

  private allowed(user: AuthUser, event: AppEvent): Observable<AppEvent> {
    const visibility = eventVisibility(user, event);
    if (visibility === 'yes') return of(event);
    if (visibility === 'no' || event.type !== 'surgery.updated')
      return from([]);
    return from(this.access.hasActiveLink(user.id, event.surgeryId)).pipe(
      mergeMap((isLinked) => (isLinked ? of(event) : from([]))),
    );
  }
}
