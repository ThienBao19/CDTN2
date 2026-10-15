export type Role = "FAMILY" | "STAFF" | "ADMIN";

export type User = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
};

export type StatusRef = { id?: number; code: string; label: string; sortOrder: number };

export type Room = { id: string; name: string; location: string | null };

export type Patient = {
  id: string;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
};

export type Surgery = {
  id: string;
  title: string;
  scheduledAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  patient: Patient;
  room: Room | null;
  currentStatus: StatusRef;
};

export type HistoryEntry = {
  id: string;
  changedAt: string;
  note?: string | null;
  isOverride?: boolean;
  status: { code: string; label: string };
  updatedBy?: { fullName: string };
};

export type TrackingCodeView = {
  id: string;
  status: "PENDING" | "USED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  createdBy: string;
};

export type IssuedCode = { id: string; code: string; expiresAt: string };

export type FamilySurgery = {
  linkId: string;
  surgeryId: string;
  title: string;
  patientName: string;
  room: { name: string; location: string | null } | null;
  scheduledAt: string;
  isCancelled: boolean;
  currentStatus: StatusRef;
  updatedAt: string;
  history?: HistoryEntry[];
};

export type NotificationItem = {
  id: string;
  surgeryId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationList = { items: NotificationItem[]; unreadCount: number };
