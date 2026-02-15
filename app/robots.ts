import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/registro", "/forgot-password"],
        disallow: [
          "/dashboard",
          "/publicaciones",
          "/postulantes",
          "/mensajes",
          "/configuracion",
          "/videollamadas",
          "/planes",
          "/verificar-email",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://empresas.trabajo-ya.com/sitemap.xml",
  };
}

