import { createFileRoute } from "@tanstack/react-router";
import { globalOtpStore } from "@/lib/otp-store";

export const Route = createFileRoute("/api/verify-otp")({
  server: {
    handlers: {
      POST: async ({ request, context }: { request: Request; context: any }) => {
        const body = await request.json();
        const { sessionId, otp } = body ?? {};

        if (!sessionId || !otp) {
          return new Response(JSON.stringify({ success: false, reason: "missing_data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // 1. Try to find data in the Memory Store (Local Dev) or KV (Production)
        const cloudflare = (context as any);
        const KV = cloudflare?.OTP_SESSIONS || cloudflare?.cloudflare?.env?.OTP_SESSIONS;
        
        // Get data from memory store first, then fallback to KV if available
        let sessionData = globalOtpStore.get(sessionId);
        
        if (!sessionData && KV) {
          sessionData = await KV.get(sessionId);
        }

        if (!sessionData) {
          console.error(`Verification failed: Session ${sessionId} not found.`);
          return new Response(JSON.stringify({ success: false, reason: "session_not_found" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const session = JSON.parse(sessionData);

        // 2. Expiry Check
        if (Date.now() > session.expiresAt) {
          globalOtpStore.delete(sessionId);
          if (KV) await KV.delete(sessionId);
          return new Response(JSON.stringify({ success: false, reason: "expired" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // 3. OTP Match Check
        if (session.otp !== otp) {
          return new Response(JSON.stringify({ success: false, reason: "invalid_otp" }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // 4. Cleanup and Success
        globalOtpStore.delete(sessionId);
        if (KV) await KV.delete(sessionId);
        
        console.log(`✅ OTP Verified successfully for session: ${sessionId}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});