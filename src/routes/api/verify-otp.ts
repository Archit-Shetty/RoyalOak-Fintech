import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/verify-otp")({
  server: {
    handlers: {
      POST: async ({ request, context }: { request: Request; context: any }) => {
        const env = context as any;
        const { sessionId, otp } = await request.json();

        if (!sessionId || !otp) {
      return new Response(JSON.stringify({ success: false, reason: "session_id_and_otp_required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionData = await env.OTP_SESSIONS.get(sessionId);
    if (!sessionData) {
      return new Response(JSON.stringify({ success: false, reason: "session_not_found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = JSON.parse(sessionData);
    if (Date.now() > session.expiresAt) {
      await env.OTP_SESSIONS.delete(sessionId);
      return new Response(JSON.stringify({ success: false, reason: "expired" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (session.otp !== otp) {
      return new Response(JSON.stringify({ success: false, reason: "invalid_otp" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.OTP_SESSIONS.delete(sessionId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
      },
    },
  },
});