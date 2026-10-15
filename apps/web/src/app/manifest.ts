import type { MetadataRoute } from "next";

// PWA cho người nhà (NFR-09: web responsive, cài lên màn hình chính)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Theo dõi bệnh nhân",
    short_name: "Theo dõi",
    description: "Theo dõi tình trạng ca phẫu thuật của người thân",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#0f6cbd",
    lang: "vi",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
