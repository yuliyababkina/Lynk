// Vercel Serverless Function — POST /api/send-contract
//
// Notifies a prospect that the Principal has sent their contract and service
// catalogues for signature, with the magic link back into the signing step.
// Same server-side-only rules as api/send-invite.js: RESEND_API_KEY never
// reaches the browser bundle.
//
// Required environment variables (Vercel → Project → Settings → Environment
// Variables, NOT prefixed with VITE_):
//   RESEND_API_KEY   your Resend secret key (re_...)
//   RESEND_FROM      verified sender, e.g. "Lynk <invites@yourdomain.com>"

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

  const { to, companyName, contactName, link, contractName, catalogues, principal, sender, senderRole } =
    req.body ?? {};

  if (!to || !companyName || !link) {
    res.status(400).json({ error: "Missing required fields: to, companyName, link" });
    return;
  }

  const principalName = principal || "your Principal";
  const senderName = sender || "Procurement";
  const senderTitle = senderRole || "Procurement";
  const greeting = contactName ? `Hi ${escapeHtml(contactName)},` : "Hello,";

  // The documents awaiting signature, so the email says what it is asking for.
  const documents = [contractName, ...(Array.isArray(catalogues) ? catalogues : [])].filter(Boolean);
  const documentList = documents.length
    ? `<ul style="margin:16px 0;padding-left:20px;color:#3f3f46;font-size:14px;">
        ${documents.map((d) => `<li style="margin-bottom:4px;">${escapeHtml(d)}</li>`).join("")}
      </ul>`
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#18181b;">
      <h1 style="font-size:20px;margin:0 0 16px;">Your contract is ready to sign</h1>
      <p style="font-size:15px;line-height:1.6;">${greeting}</p>
      <p style="font-size:15px;line-height:1.6;">
        Good news — ${escapeHtml(principalName)} has approved
        <strong>${escapeHtml(companyName)}</strong>'s onboarding details and documents.
        The following are now waiting for your signature:
      </p>
      ${documentList}
      <p style="font-size:15px;line-height:1.6;">
        Please review each document carefully and sign them. Once every document is signed, your
        supplier account becomes active and can receive work orders.
      </p>
      <p style="margin:24px 0;">
        <a href="${link}" style="background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Review &amp; sign
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
        subject: `Action required: sign your contract with ${principalName}`,
        html,
      }),
    });

    const body = await resendRes.json();

    if (!resendRes.ok) {
      // Surface Resend's own message (unverified domain, etc.) so the UI can
      // show something actionable.
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
