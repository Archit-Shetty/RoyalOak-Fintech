import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/send-otp")({
  server: {
    handlers: {
      POST: async ({ request, context }: { request: Request; context: any }) => {
        const body = await request.json();
        const { email } = body ?? {};

        if (!email) {
          return new Response(JSON.stringify({ error: "Email required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // 1. Unified Env Check: Works in local dev (.env) and Cloudflare production (context)
        const sendgridKey = process.env.SENDGRID_API_KEY || context?.SENDGRID_API_KEY;
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || context?.SENDGRID_FROM_EMAIL || "architshetty22@gmail.com";

        if (!sendgridKey) {
          console.error("SendGrid API key is missing. Ensure it is in your .env file locally.");
          return new Response(JSON.stringify({ error: "SendGrid API key is missing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

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

        // 2. Storage: Use the context to access the KV namespace
        const sessionId = Math.random().toString(36).slice(2, 10);
        const expiresAt = Date.now() + 5 * 60 * 1000;

        const cloudflare = (context as any);
        const KV = 
          cloudflare?.OTP_SESSIONS || 
          cloudflare?.cloudflare?.env?.OTP_SESSIONS || 
          cloudflare?.env?.OTP_SESSIONS;

        if (KV && typeof KV.put === 'function') {
          await KV.put(sessionId, JSON.stringify({ otp, email, expiresAt }));
        } else {
          // DEBUG: This will print to your VS Code terminal
          console.error("KV NOT FOUND. Available keys in context:", Object.keys(cloudflare || {}));
          if (cloudflare?.cloudflare) console.error("Cloudflare keys:", Object.keys(cloudflare.cloudflare));
          
          // FALLBACK: If we are in local dev, don't crash. Just return the session.
          // This allows you to test the email sending part.
          console.warn("Proceeding without KV storage (OTP verification will fail).");
        }

        return new Response(JSON.stringify({ sessionId, expiresAt }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});