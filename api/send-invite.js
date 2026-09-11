// Vercel Serverless Function — POST /api/send-invite
//
// Actually sends the onboarding invitation email (with the real magic link)
// via Resend. This runs server-side only, so RESEND_API_KEY never ships to
// the browser bundle (unlike VITE_-prefixed vars, which Vite inlines into
// the client build).
//
// Required environment variables (set in Vercel → Project → Settings →
// Environment Variables — NOT prefixed with VITE_):
//   RESEND_API_KEY   your Resend secret key (re_...)
//   RESEND_FROM      verified sender, e.g. "Lynk <invites@yourdomain.com>"
//                     Falls back to Resend's shared test address, which can
//                     only deliver to the Resend account's own inbox — see
//                     SETUP.md for the domain-verification step needed to
//                     send to arbitrary prospect/supplier addresses.

const DEFAULT_FROM = "Lynk <onboarding@resend.dev>";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "RESEND_API_KEY is not configured on the server. Add it in Vercel → Settings → Environment Variables.",
    });
    return;
  }

  const { to, companyName, contactName, link, note, principal, sender, senderRole } = req.body ?? {};

  if (!to || !companyName || !link) {
    res.status(400).json({ error: "Missing required fields: to, companyName, link" });
    return;
  }

  // The inviting Principal and the person signing it. Defaults keep older
  // callers working; src/lib/principal.ts is the single source on the client.
  const principalName = principal || "Urban Habitat Management GmbH";
  const senderName = sender || "Sabine Müller";
  const senderTitle = senderRole || "Procurement Manager";

  // Greet by first name, matching the onboarding screen.
  const firstName = contactName ? String(contactName).trim().split(/\s+/)[0] : "";
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
  const noteBlock = note
    ? `<p style="margin:16px 0;padding:12px 16px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#3f3f46;">${escapeHtml(note)}</p>`
    : "";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;">
      <p>${greeting}</p>
      <p>
        You've been invited to join <strong>${escapeHtml(principalName)}</strong>'s supplier network on Lynk.
      </p>
      <p>
        We'd like to extend our supplier relationship with
        <strong>${escapeHtml(companyName)}</strong>. Your existing profile has been pre-filled — please
        confirm your details and upload any new requirements.
      </p>
      ${noteBlock}
      <p style="margin:24px 0;">
        <a href="${link}" style="background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Start onboarding
        </a>
      </p>
      <p style="color:#71717a;font-size:13px;">
        Or paste this link into your browser:<br />
        <a href="${link}" style="color:#71717a;">${link}</a>
      </p>
      <p style="margin-top:24px;font-size:14px;color:#3f3f46;">
        Best regards,<br />
        ${escapeHtml(senderName)}<br />
        <span style="color:#71717a;">${escapeHtml(senderTitle)} at ${escapeHtml(principalName)}</span>
      </p>
    </div>
  `;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [to],
        // The invitee joins the Principal's network — companyName is their own
        // company, so naming it here would read backwards.
        subject: `You're invited to join ${principalName}'s supplier network on Lynk`,
        html,
      }),
    });

    const body = await resendRes.json();

    if (!resendRes.ok) {
      // Surface Resend's own error message (e.g. "unverified domain" or
      // "can only send to your own address until you verify a domain") so
      // the UI can show something actionable instead of a generic failure.
      res.status(resendRes.status).json({ error: body?.message || "Resend rejected the request" });
      return;
    }

    res.status(200).json({ id: body.id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error sending email" });
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
