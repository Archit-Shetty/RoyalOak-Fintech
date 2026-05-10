import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/send-otp")({
  server: {
    handlers: {
      POST: async ({ request, context }: { request: Request; context: any }) => {
        const env = context as any;
        const body = await request.json();
        const { email } = body ?? {};

        if (!email) {
          return new Response(JSON.stringify({ error: "Email required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const sendgridKey = env?.SENDGRID_API_KEY;
        if (!sendgridKey) {
          console.error("SendGrid API key is not configured in Cloudflare env.");
          return new Response(JSON.stringify({ error: "SendGrid API key is missing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const fromEmail = env?.SENDGRID_FROM_EMAIL ?? "architshetty22@gmail.com";
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        try {
          const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${sendgridKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email }] }],
              from: { email: fromEmail, name: "RoyalOak" },
              subject: "Your OTP for RoyalOak Registration",
              content: [
                { type: "text/plain", value: `Your OTP is: ${otp}` },
                { type: "text/html", value: `<p>Your OTP is: <strong>${otp}</strong></p>` },
              ],
            }),
          });
          if (!emailResponse.ok) {
            const responseText = await emailResponse.text();
            console.error("SendGrid API error:", responseText);
            return new Response(
              JSON.stringify({ error: "Failed to send email", details: responseText }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
        } catch (error) {
          console.error("Email send failed:", error);
          return new Response(JSON.stringify({ error: "Failed to send email", details: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const sessionId = Math.random().toString(36).slice(2, 10);
        const expiresAt = Date.now() + 5 * 60 * 1000;
        await env.OTP_SESSIONS.put(sessionId, JSON.stringify({ otp, email, expiresAt }));

        return new Response(JSON.stringify({ sessionId, expiresAt }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});