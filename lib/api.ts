const BASE_URL = "https://techxpression-hackathon.onrender.com/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit
) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include", // 🔥 REQUIRED
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}
