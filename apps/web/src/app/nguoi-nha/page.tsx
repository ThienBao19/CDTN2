import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionHome } from "@/lib/server-session";
import { FamilyAccessForm } from "./family-access-form";

export const dynamic = "force-dynamic";

export default async function FamilyEntryPage() {
  // Người nhà đã vào xem và phiên còn hạn: không hỏi lại thông tin
  if ((await sessionHome()) === "/theo-doi") redirect("/theo-doi");
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Theo dõi người thân</h1>
        <p className="text-muted">
          Nhập số điện thoại và họ tên bạn đã cung cấp cho nhân viên y tế, cùng họ tên bệnh nhân.
        </p>
      </div>
      <FamilyAccessForm />
      <p className="text-sm text-muted">
        Chưa được đăng ký? Hãy nhờ nhân viên y tế tại quầy thêm số điện thoại của bạn vào ca phẫu thuật.
      </p>
      <Link href="/dang-nhap" className="text-center text-sm text-primary">
        Nhân viên y tế / quản trị viên đăng nhập
      </Link>
    </main>
  );
}
