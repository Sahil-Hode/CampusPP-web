export const BASE_URL = "https://techxpression-hackathon.onrender.com/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers: {
      ...(!(options.body instanceof FormData) && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.body,
  });

  const rawText = await res.text();
  let data: any = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { message: rawText };
    }
  } else {
    data = { message: `Request failed with status ${res.status}` };
  }

  if (!res.ok) {
    console.error(`API Error ${res.status}: ${res.url}`, data);

    // Handle Session Expiration
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    if (typeof data === "object" && data !== null) {
      throw { statusCode: res.status, ...(data as object) };
    }
    throw { statusCode: res.status, message: String(data) };
  }

  return data;
}
