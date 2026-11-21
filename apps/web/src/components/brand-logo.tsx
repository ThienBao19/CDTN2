import Image from "next/image";
import { APP_NAME } from "@/lib/brand";

type Props = {
  subtitle?: string;
  size?: "md" | "lg";
  // "onDark": chữ trắng trên nền xanh của thanh bên
  tone?: "default" | "onDark";
};

const MARK_SIZE = { md: 40, lg: 64 };

// Logo: chữ thập y tế trên nền khiên xanh, sóng sông Đồng Nai; kèm tên bệnh viện
export function BrandLogo({ subtitle, size = "md", tone = "default" }: Props) {
  const mark = MARK_SIZE[size];
  const isOnDark = tone === "onDark";
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.svg"
        alt=""
        width={mark}
        height={mark}
        priority
        className={isOnDark ? "rounded-xl ring-2 ring-white/30" : "rounded-xl"}
      />
      <div className="flex flex-col leading-tight">
        <span className={`${size === "lg" ? "text-2xl" : "text-lg"} font-bold ${isOnDark ? "text-white" : "text-[#14532d] dark:text-green-300"}`}>
          {APP_NAME}
        </span>
        {subtitle && (
          <span className={`text-sm ${isOnDark ? "text-green-100" : "text-muted"}`}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
