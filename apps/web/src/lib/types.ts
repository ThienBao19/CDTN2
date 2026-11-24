
export type Role = "FAMILY" | "STAFF" | "ADMIN";

export type User = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
};

export type StatusRef = {
  id?: number;
  code: string;
  label: string;
  sortOrder: number;

  // Thời gian dự kiến mặc định do Admin cấu hình (phút).
  expectedMinutes?: number | null;
};

export type Room = {
  id: string;
  name: string;
  location: string | null;
};

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

  // Thời gian dự kiến riêng của ca trong giai đoạn hiện tại.
  // null: sử dụng thời gian mặc định của Admin.
  expectedMinutes?: number | null;

  // Thời điểm bắt đầu giai đoạn hiện tại.
  stageStartedAt?: string | null;

  // Thời gian dự kiến thực tế đang áp dụng (phút).
  effectiveExpectedMinutes?: number | null;

  // Thời điểm hoàn thành dự kiến của giai đoạn hiện tại.
  expectedFinishAt?: string | null;

  // Ca phẫu thuật đã vượt quá thời gian dự kiến hay chưa.
  isOverdue?: boolean;

  // Số phút vượt quá thời gian dự kiến.
  overdueMinutes?: number;

  // Đã tạo thông báo quá giờ cho tất cả người nhà
  // đang theo dõi trong giai đoạn hiện tại hay chưa.
  overdueNotificationSent?: boolean;

  // Số người nhà đã được tạo thông báo quá giờ.
  overdueNotificationRecipientCount?: number;

  // Số người nhà chưa được tạo thông báo quá giờ.
  overdueNotificationPendingCount?: number;

  // Tổng số người nhà đang có liên kết theo dõi còn hiệu lực.
  overdueNotificationTotalRecipients?: number;

  patient: Patient;
  room: Room | null;
  currentStatus: StatusRef;
};

export type HistoryEntry = {
  id: string;
  changedAt: string;
  note?: string | null;
  isOverride?: boolean;
  status: {
    code: string;
    label: string;
  };
  updatedBy?: {
    fullName: string;
  };
};

export type FamilyContact = {
  id: string;
  phone: string;
  fullName: string;
  status: "ACTIVE" | "REVOKED";
  linkedAt: string;
  addedBy: string | null;
};

export type FamilySurgery = {
  linkId: string;
  surgeryId: string;
  title: string;
  patientName: string;
  room: {
    name: string;
    location: string | null;
  } | null;
  scheduledAt: string;
  isCancelled: boolean;
  currentStatus: StatusRef;
  updatedAt: string;

  // Thời điểm hoàn thành dự kiến của giai đoạn hiện tại.
  // null: chưa có dự kiến hoặc ca đã hoàn tất/đã hủy.
  expectedFinishAt?: string | null;

  history?: HistoryEntry[];
};

export type NotificationItem = {
  id: string;
  surgeryId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

export type NotificationList = {
  items: NotificationItem[];
  unreadCount: number;
};
