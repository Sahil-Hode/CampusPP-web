const BASE_URL = "https://techxpression-hackathon.onrender.com/api";

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

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { message: "Invalid JSON response" };
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

    throw data;
  }

  return data;
}
