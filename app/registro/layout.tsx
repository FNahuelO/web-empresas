import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrá tu Empresa - TrabajoYa",
  description:
    "Registrá tu empresa en TrabajoYa y empezá a publicar ofertas de trabajo. Encontrá candidatos calificados, gestioná postulaciones y contratá talento en Argentina.",
  alternates: {
    canonical: "https://empresas.trabajo-ya.com/registro",
  },
  openGraph: {
    title: "Registrá tu Empresa - TrabajoYa",
    description:
      "Creá tu cuenta de empresa en TrabajoYa. Publicá empleos y encontrá al candidato ideal para tu equipo.",
    url: "https://empresas.trabajo-ya.com/registro",
  },
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

