import Link from "next/link";
import { XCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[75vh] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 rounded-full bg-red-50 p-3">
              <XCircleIcon className="h-10 w-10 text-red-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Hubo un error al procesar el pago
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-600 sm:text-base">
              Por favor, intenta nuevamente o contacta al soporte.
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/publicaciones"
                className="rounded-lg bg-[#002D5A] px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#02345fb6]"
              >
                Reintentar pago
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Volver al dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
