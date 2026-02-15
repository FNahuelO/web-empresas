import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://empresas.trabajo-ya.com";
const SITE_NAME = "TrabajoYa Empresas";
const SITE_DESCRIPTION =
  "Portal para empresas de TrabajoYa. Publicá ofertas de empleo, gestioná postulantes, realizá entrevistas y encontrá el talento ideal para tu empresa en Argentina.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#033360",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TrabajoYa Empresas - Publicá ofertas y encontrá talento",
    template: "%s | TrabajoYa Empresas",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "publicar empleo",
    "buscar empleados",
    "portal empresas",
    "recursos humanos",
    "contratar personal",
    "ofertas laborales",
    "postulantes",
    "selección de personal",
    "TrabajoYa",
    "Argentina",
    "gestión de postulaciones",
    "reclutamiento",
    "bolsa de trabajo empresas",
    "publicar avisos de trabajo",
  ],
  authors: [{ name: "TrabajoYa" }],
  creator: "TrabajoYa",
  publisher: "TrabajoYa",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon-blanco.png",
    shortcut: "/icon-blanco.png",
    apple: "/icon-blanco.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "TrabajoYa Empresas - Publicá ofertas y encontrá talento",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "TrabajoYa Empresas - Portal de reclutamiento",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrabajoYa Empresas - Publicá ofertas y encontrá talento",
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
    creator: "@trabajoya",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "employment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
