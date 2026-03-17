const AUTH_KEYS = [
  "token",
  "access_token",
  "user_name",
  "user_email",
  "student_id",
  "user_role",
  "institute_id",
];

export const setToken = (token: string) => {
  // Session-only auth so closing the website logs out automatically.
  sessionStorage.setItem("token", token);
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
};

export const getToken = () => {
  const sessionToken = sessionStorage.getItem("token") || sessionStorage.getItem("access_token");
  if (sessionToken) return sessionToken;

  // One-time migration for legacy localStorage token.
  const legacyToken = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (legacyToken) {
    sessionStorage.setItem("token", legacyToken);
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    return legacyToken;
  }

  return null;
};

export const clearAuthData = () => {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

export const logout = () => {
  clearAuthData();
  window.location.href = "/institute-login";
};
