import { Role } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { AppEvent } from './events.service';

// Ai được nhận sự kiện nào; người nhà cần kiểm tra thêm liên kết còn hiệu lực
export function eventVisibility(
  user: AuthUser,
  event: AppEvent,
): 'yes' | 'no' | 'check-link' {
  if (event.type === 'notification.created') {
    return event.userId === user.id ? 'yes' : 'no';
  }
  return user.role === Role.FAMILY ? 'check-link' : 'yes';
}
