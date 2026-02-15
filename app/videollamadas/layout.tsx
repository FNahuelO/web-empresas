import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function VideollamadasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

