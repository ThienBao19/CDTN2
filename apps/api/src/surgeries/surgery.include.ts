import { Prisma } from '@prisma/client';

export const SURGERY_INCLUDE = {
  patient: true,
  room: true,
  currentStatus: true,
} satisfies Prisma.SurgeryInclude;

export type SurgeryWithRelations = Prisma.SurgeryGetPayload<{
  include: typeof SURGERY_INCLUDE;
}>;

const VN_OFFSET = '+07:00';
const DAY_MS = 24 * 60 * 60 * 1000;

// Khoảng thời gian của một ngày theo giờ Việt Nam
export function dayRange(date: string): { gte: Date; lt: Date } {
  const start = new Date(`${date}T00:00:00${VN_OFFSET}`);
  return { gte: start, lt: new Date(start.getTime() + DAY_MS) };
}
