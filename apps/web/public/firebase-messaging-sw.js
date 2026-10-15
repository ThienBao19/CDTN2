// Service worker nhận push từ Firebase Cloud Messaging và hiển thị thông báo.
// Không cần nạp Firebase SDK: tự đọc gói tin push theo định dạng FCM.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || "Cập nhật ca phẫu thuật";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body || "",
      icon: "/icon.svg",
      data: { url: data.url || "/theo-doi" },
      tag: data.surgeryId || undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/theo-doi";
  event.waitUntil(self.clients.openWindow(url));
});
