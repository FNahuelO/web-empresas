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

function extractOrderIdFromConcept(rawConcept: unknown): string | null {
  const concept = String(rawConcept || "").trim();
  if (!concept) return null;

  const orderPattern =
    /(?:^|[|,;\s])(?:ORDER|ORDER_ID|PAYMENT_ORDER_ID|PAYMENTORDERID)\s*[:=]\s*([A-Za-z0-9\-_]+)/i;
  const orderMatch = concept.match(orderPattern);
  if (orderMatch?.[1]) return orderMatch[1].trim();

  // Soporta formato: "<orderId> | Plan: XXX"
  const firstSegment = concept.split("|")[0]?.trim();
  if (/^[A-Za-z0-9][A-Za-z0-9\-_]{8,}$/.test(firstSegment || "")) {
    return firstSegment || null;
  }

  // Si concept viene solo con el orderId (ej: UUID), usarlo directo.
  if (!concept.includes(" ")) {
    return concept;
  }

  return null;
}

function extractJobIdFromConcept(rawConcept: unknown): string | null {
  const concept = String(rawConcept || "").trim();
  if (!concept) return null;

  const jobPattern = /(?:^|[|,;\s])JOB(?:_ID)?\s*[:=]\s*([A-Za-z0-9\-_]+)/i;
  const jobMatch = concept.match(jobPattern);
  if (jobMatch?.[1]) return jobMatch[1].trim();

  return null;
}

function extractOrderId(body: any): string | null {
  const direct = extractField(body, [
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

  if (direct) return direct;

  const concept = extractField(body, [
    "concept",
    "payload.concept",
    "data.concept",
    "resource.concept",
    "resource.metadata.concept",
    "metadata.concept",
    "meta.concept",
    "query_ticket_text",
    "payload.query_ticket_text",
    "data.query_ticket_text",
  ]);
  return extractOrderIdFromConcept(concept);
}

function extractJobId(body: any): string | null {
  const direct = extractField(body, [
    "jobId",
    "job_id",
    "payload.jobId",
    "payload.job_id",
    "data.jobId",
    "data.job_id",
    "metadata.jobId",
    "meta.jobId",
  ]);

  if (direct) return direct;

  const concept = extractField(body, [
    "concept",
    "payload.concept",
    "data.concept",
    "resource.concept",
    "resource.metadata.concept",
    "metadata.concept",
    "meta.concept",
  ]);
  return extractJobIdFromConcept(concept);
}

function detectPaymentState(body: any): "confirm" | "reject" | "pending" {
  const responseCode = safeUpper(
    extractField(body, [
      "cod_respuesta",
      "payload.cod_respuesta",
      "data.cod_respuesta",
      "response_code",
      "payload.response_code",
      "data.response_code",
    ])
  );
  if (responseCode === "0" || responseCode === "00") {
    return "confirm";
  }

  if (responseCode && responseCode !== "0" && responseCode !== "00") {
    return "reject";
  }

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
      "msg_respuesta",
      "payload.msg_respuesta",
      "data.msg_respuesta",
    ])
  );

  if (!status) return "pending";

  const approvedValues = [
    "APPROVED",
    "COMPLETED",
    "PAID",
    "SUCCESS",
    "SUCCEEDED",
    "EXITOSA",
    "EXITOSO",
    "COBRANZA EXITOSA",
    "COBRANZA EXITOSO",
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

function buildDebugSnapshot(body: any): Record<string, unknown> {
  const keysOfInterest = [
    "cod_respuesta",
    "msg_respuesta",
    "status",
    "paymentStatus",
    "payment_status",
    "orderId",
    "order_id",
    "jobId",
    "job_id",
    "reference",
    "external_reference",
    "concept",
    "amount",
    "importe",
    "cod_cliente",
    "query_ticket_text",
  ];

  const snapshot: Record<string, unknown> = {};
  for (const key of keysOfInterest) {
    if (body?.[key] !== undefined) {
      snapshot[key] = body[key];
    }
  }
  return snapshot;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    const userAgent = request.headers.get("user-agent");
    const forwardedFor = request.headers.get("x-forwarded-for");
    console.log("[COIN IPN] Request recibida", {
      method: request.method,
      contentType,
      userAgent,
      forwardedFor,
    });

    const body = await readIncomingBody(request);
    const orderId = extractOrderId(body);
    const jobId = extractJobId(body);
    const state = detectPaymentState(body);
    const debugSnapshot = buildDebugSnapshot(body);

    console.log("[COIN IPN] Payload parseado", {
      orderId,
      jobId,
      state,
      snapshot: debugSnapshot,
    });

    if (state === "pending") {
      console.log("[COIN IPN] Estado pendiente, no se envía a backend", {
        orderId,
        jobId,
      });
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

    console.log("[COIN IPN] Enviando a backend", {
      backendEndpoint,
      hasSharedSecret: Boolean(ipnSecret),
      orderId,
      jobId,
      state,
    });

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
    console.log("[COIN IPN] Respuesta backend", {
      status: backendRes.status,
      ok: backendRes.ok,
      body: backendPayload,
      orderId,
      jobId,
      state,
    });

    if (!backendRes.ok) {
      console.error("[COIN IPN] Error procesando IPN en backend", {
        status: backendRes.status,
        backend: backendPayload,
        orderId,
        jobId,
        state,
      });
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
    console.error("[COIN IPN] Error interno", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Error interno procesando IPN de COIN",
      },
      { status: 500 }
    );
  }
}
