import { NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function safeUpper(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function parseDelimitedBody(raw: string): Record<string, string> {
  const params = new URLSearchParams(raw);
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

async function readIncomingBody(request: Request): Promise<any> {
  const contentType = safeUpper(request.headers.get("content-type"));
  const rawText = await request.text();
  if (!rawText) return {};

  if (contentType.includes("APPLICATION/JSON")) {
    try {
      return JSON.parse(rawText);
    } catch {
      return { raw: rawText };
    }
  }

  if (
    contentType.includes("APPLICATION/X-WWW-FORM-URLENCODED") ||
    contentType.includes("TEXT/PLAIN")
  ) {
    return parseDelimitedBody(rawText);
  }

  return { raw: rawText };
}

function extractField(body: any, paths: string[]): string | null {
  for (const path of paths) {
    const parts = path.split(".");
    let current: any = body;
    for (const part of parts) {
      current = current?.[part];
      if (current === undefined || current === null) {
        break;
      }
    }
    if (typeof current === "string" && current.trim()) {
      return current.trim();
    }
  }
  return null;
}

function extractOrderId(body: any): string | null {
  return extractField(body, [
    "orderId",
    "order_id",
    "payload.orderId",
    "payload.order_id",
    "data.orderId",
    "data.order_id",
    "resource.id",
    "resource.order_id",
    "reference",
    "external_reference",
    "metadata.orderId",
    "meta.orderId",
  ]);
}

function extractJobId(body: any): string | null {
  return extractField(body, [
    "jobId",
    "job_id",
    "payload.jobId",
    "payload.job_id",
    "data.jobId",
    "data.job_id",
    "metadata.jobId",
    "meta.jobId",
  ]);
}

function detectPaymentState(body: any): "confirm" | "reject" | "pending" {
  const status = safeUpper(
    extractField(body, [
      "status",
      "paymentStatus",
      "payment_status",
      "state",
      "payload.status",
      "payload.payment_status",
      "data.status",
      "resource.status",
    ])
  );

  if (!status) return "pending";

  const approvedValues = [
    "APPROVED",
    "COMPLETED",
    "PAID",
    "SUCCESS",
    "SUCCEEDED",
    "ACREDITADO",
    "APROBADO",
  ];
  const rejectedValues = [
    "FAILED",
    "FAIL",
    "REJECTED",
    "DECLINED",
    "CANCELLED",
    "CANCELED",
    "ERROR",
    "EXPIRED",
    "DENIED",
    "RECHAZADO",
  ];

  if (approvedValues.some((value) => status.includes(value))) return "confirm";
  if (rejectedValues.some((value) => status.includes(value))) return "reject";
  return "pending";
}

export async function POST(request: Request) {
  try {
    const body = await readIncomingBody(request);
    const orderId = extractOrderId(body);
    const jobId = extractJobId(body);
    const state = detectPaymentState(body);

    if (state === "pending") {
      return NextResponse.json({
        ok: true,
        message: "IPN recibido en estado pendiente",
        orderId,
        jobId,
      });
    }

    const ipnSecret = process.env.IPN_SHARED_SECRET;
    const backendEndpoint =
      state === "confirm"
        ? `${BACKEND_BASE_URL}/api/payments/ipn/confirm`
        : `${BACKEND_BASE_URL}/api/payments/ipn/reject`;

    const backendRes = await fetch(backendEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ipnSecret ? { "x-ipn-secret": ipnSecret } : {}),
      },
      body: JSON.stringify({
        orderId,
        jobId,
        payload: body,
      }),
      cache: "no-store",
    });

    const backendPayload = await backendRes.json().catch(() => null);
    if (!backendRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "No se pudo procesar IPN en backend",
          status: backendRes.status,
          backend: backendPayload,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      state,
      orderId,
      jobId,
      backend: backendPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Error interno procesando IPN de COIN",
      },
      { status: 500 }
    );
  }
}
