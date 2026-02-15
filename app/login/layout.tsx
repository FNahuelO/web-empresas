import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión - Portal Empresas",
  description:
    "Iniciá sesión en el portal de empresas de TrabajoYa. Gestioná tus publicaciones de empleo, revisá postulantes y encontrá el talento ideal para tu empresa.",
  alternates: {
    canonical: "https://empresas.trabajo-ya.com/login",
  },
  openGraph: {
    title: "Iniciar Sesión - TrabajoYa Empresas",
    description:
      "Accedé al portal de empresas de TrabajoYa para gestionar tus ofertas de empleo y postulantes.",
    url: "https://empresas.trabajo-ya.com/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

