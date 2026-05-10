// src/lib/otp-store.ts
// A simple Map to store OTP data in memory during local development
export const globalOtpStore = new Map<string, string>();