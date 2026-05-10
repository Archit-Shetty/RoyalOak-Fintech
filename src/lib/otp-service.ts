const STORAGE_KEY = "royaloak_otp_session";

interface OtpSession {
  sessionId: string;
  email: string;
  code: string;
  expiresAt: number;
}

function getStoredSession(): OtpSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OtpSession;
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(session: OtpSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function randomSessionId() {
  return Math.random().toString(36).slice(2, 10);
}

function randomOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtpToEmail(email: string) {
  const response = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send OTP");
  }

  const data = await response.json();
  return {
    sessionId: data.sessionId,
    expiresAt: data.expiresAt,
  };
}

export async function verifyOtpCode(sessionId: string, otp: string) {
  const response = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, otp }),
  });

  if (!response.ok) {
    return { success: false, reason: "network_error" };
  }

  const data = await response.json();
  return data;
}

export async function getOtpSessionInfo(sessionId: string) {
  const session = getStoredSession();
  if (!session || session.sessionId !== sessionId) return null;
  return {
    email: session.email,
    expiresAt: session.expiresAt,
  };
}
