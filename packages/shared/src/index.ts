// Vai trò người dùng (mục 3 tài liệu dự án)
export const ROLES = ['FAMILY', 'STAFF', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

// 5 trạng thái ca phẫu thuật theo thứ tự cố định (mục 4).
// Nguồn chính là bảng status_definitions; hằng số này dùng cho seed và hiển thị mặc định.
export const SURGERY_STATUSES = [
  {
    code: 'RECEIVED',
    order: 1,
    label: 'Đã tiếp nhận',
    description: 'Bệnh nhân đã được tiếp nhận cho ca phẫu thuật.',
    notification: 'Bệnh nhân đã được tiếp nhận.',
  },
  {
    code: 'PREPARING',
    order: 2,
    label: 'Đang chuẩn bị',
    description: 'Bệnh nhân đang được chuẩn bị trước phẫu thuật.',
    notification: 'Bệnh nhân đang được chuẩn bị trước phẫu thuật.',
  },
  {
    code: 'IN_SURGERY',
    order: 3,
    label: 'Đang phẫu thuật',
    description: 'Ca phẫu thuật đang được thực hiện.',
    notification: 'Ca phẫu thuật đã bắt đầu.',
  },
  {
    code: 'RECOVERING',
    order: 4,
    label: 'Đang hồi tỉnh',
    description: 'Ca đã kết thúc; bệnh nhân được theo dõi hồi tỉnh.',
    notification: 'Bệnh nhân đang được chuyển sang khu vực hồi sức.',
  },
  {
    code: 'COMPLETED',
    order: 5,
    label: 'Đã hoàn tất',
    description: 'Ca hoàn tất; chuyển sang khu vực tiếp theo.',
    notification: 'Ca phẫu thuật đã hoàn tất.',
  },
] as const

export type SurgeryStatusCode = (typeof SURGERY_STATUSES)[number]['code']
