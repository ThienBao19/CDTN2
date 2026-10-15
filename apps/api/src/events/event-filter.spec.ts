import { Role } from '@prisma/client';
import { eventVisibility } from './event-filter';

const family = { id: 'f1', role: Role.FAMILY, fullName: 'F' };
const staff = { id: 's1', role: Role.STAFF, fullName: 'S' };

describe('eventVisibility', () => {
  it('sends surgery updates to staff directly', () => {
    expect(
      eventVisibility(staff, { type: 'surgery.updated', surgeryId: 'x' }),
    ).toBe('yes');
  });

  it('requires a link check for family surgery updates', () => {
    expect(
      eventVisibility(family, { type: 'surgery.updated', surgeryId: 'x' }),
    ).toBe('check-link');
  });

  it('only delivers notifications to their owner', () => {
    const event = {
      type: 'notification.created' as const,
      userId: 'f1',
      surgeryId: 'x',
    };
    expect(eventVisibility(family, event)).toBe('yes');
    expect(eventVisibility(staff, event)).toBe('no');
  });
});
