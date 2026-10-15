"use client";

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { api } from "./api";

const TOKEN_KEY = "pt_push_token";

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function isPushConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId && VAPID_KEY);
}

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Trình duyệt chặn localStorage: bỏ qua, chỉ ảnh hưởng nút tắt thông báo
  }
}

export function isPushEnabled(): boolean {
  return readToken() !== null && typeof Notification !== "undefined" && Notification.permission === "granted";
}

async function messaging() {
  if (!isPushConfigured() || !(await isSupported())) {
    throw new Error("Trình duyệt hoặc hệ thống chưa hỗ trợ thông báo đẩy");
  }
  return getMessaging(initializeApp(config));
}

// Xin quyền, lấy token FCM và đăng ký với máy chủ (POST /devices)
export async function enablePush(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Bạn chưa cho phép hiển thị thông báo");
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(await messaging(), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  await api.post("/devices", { token, platform: "WEB" });
  writeToken(token);
}

export async function disablePush(): Promise<void> {
  const token = readToken();
  if (token) {
    await api.delete("/devices", { token });
    await deleteToken(await messaging()).catch(() => undefined);
  }
  writeToken(null);
}
