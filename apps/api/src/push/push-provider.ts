export type PushMessage = {
  title: string;
  body: string;
  data: Record<string, string>;
};

export type PushResult = {
  successCount: number;
  // Token không còn hợp lệ (gỡ app, hết hạn) cần xóa khỏi CSDL
  invalidTokens: string[];
  // Lỗi tạm thời, có thể thử lại
  errors: string[];
};

export abstract class PushProvider {
  abstract isEnabled(): boolean;
  abstract send(tokens: string[], message: PushMessage): Promise<PushResult>;
}

// Dùng khi chưa cấu hình Firebase: không gửi, thông báo vẫn lưu trong ứng dụng
export class DisabledPushProvider extends PushProvider {
  isEnabled(): boolean {
    return false;
  }

  send(): Promise<PushResult> {
    return Promise.resolve({ successCount: 0, invalidTokens: [], errors: [] });
  }
}
