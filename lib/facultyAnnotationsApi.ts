import { NextRequest } from "next/server";

const CORE_API_BASE =
  process.env.CORE_API_BASE_URL?.trim() ||
  "https://campuspp-f7qx.onrender.com/api";

type ProxyResult = {
  status: number;
  payload: unknown;
};

function buildHeaders(req: NextRequest, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  const authorization = req.headers.get("authorization");

  headers.set("Content-Type", "application/json");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  return headers;
}

export async function proxyFacultyAnnotations(
  req: NextRequest,
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: HeadersInit }
): Promise<ProxyResult> {
  const response = await fetch(`${CORE_API_BASE}${path}`, {
    ...init,
    headers: buildHeaders(req, init?.headers),
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: unknown = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {
        success: response.ok,
        message: raw,
      };
    }
  }

  if (!payload) {
    payload = {
      success: response.ok,
      message: response.ok ? "OK" : "Request failed",
    };
  }

  return {
    status: response.status,
    payload,
  };
}
