"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const STORAGE_KEY = "ty-empresas-mobile-desktop-disclaimer-dismissed";

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.trabajoya.app";
const APP_STORE_URL =
  "https://apps.apple.com/us/app/trabajo-ya/id6757190754";

export default function MobileDesktopDisclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 1023px)");

    const sync = () => {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setVisible(false);
        return;
      }
      setVisible(mq.matches);
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-secondary-900/55 backdrop-blur-[2px]"
        onClick={dismiss}
        aria-label="Cerrar aviso"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-desktop-disclaimer-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-secondary-100 bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-2 text-secondary-500 hover:bg-secondary-50 hover:text-secondary-800"
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <h2
          id="mobile-desktop-disclaimer-title"
          className="pr-10 text-lg font-semibold text-secondary-900"
        >
          Portal pensado para computadora
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-secondary-800">
          Para gestionar tu empresa con comodidad desde el celular, descargá la
          app TrabajoYa. Podés seguir usando esta web, pero la experiencia es
          limitada en pantallas chicas.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href={PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 sm:min-w-[140px]"
          >
            Google Play
          </a>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-secondary-900 px-4 py-3 text-sm font-semibold text-white hover:bg-secondary-800 sm:min-w-[140px]"
          >
            App Store
          </a>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="mt-4 w-full rounded-lg border border-secondary-200 py-3 text-sm font-medium text-secondary-800 hover:bg-secondary-50"
        >
          Continuar en la web
        </button>
      </div>
    </div>
  );
}
