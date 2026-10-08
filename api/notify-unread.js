// Vercel Serverless Function — POST /api/notify-unread
//
// One rule, kept deliberately small: if a side has unread messages and has not
// opened the chat for UNREAD_GRACE_MINUTES, send ONE email saying so. Nothing
// more goes out until that side actually visits the conversation, which clears
// notified_at (see markChatReadDb in src/lib/db.ts).
//
// Called manually in the prototype — there is no cron. Hit it with:
//   curl -X POST http://localhost:3000/api/notify-unread
// and it reports what it would send and what it sent.
//
// Required environment variables (Vercel → Project → Settings → Environment
// Variables). RESEND_API_KEY is server-only, exactly as in api/send-invite.js;
// the Supabase pair is the same public anon credentials the browser already
// holds, so this introduces no new secret:
//   RESEND_API_KEY        your Resend secret key (re_...)
//   RESEND_FROM           verified sender; falls back to Resend's test address,
//                         which only delivers to the account owner's own inbox
//   VITE_SUPABASE_URL     same project the app reads
//   VITE_SUPABASE_ANON_KEY
//
// NOTE: the anon key is enough here only because this prototype's RLS is
// permissive ("anon full access", see HANDOFF.md §3). With the production
// policies in the chat migration, this endpoint needs the service role.

import { createClient } from "@supabase/supabase-js";

const DEFAULT_FROM = "Lynk <onboarding@resend.dev>";

/** How long a side may sit on unread messages before one email goes out. */
const UNREAD_GRACE_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: "RESEND_API_KEY is not configured on the server. Add it in Vercel → Settings → Environment Variables.",
    });
    return;
  }
  if (!supabaseUrl || !supabaseKey) {
    res.status(500).json({ error: "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not configured." });
    return;
  }

  const db = createClient(supabaseUrl, supabaseKey);
  const now = Date.now();
  const graceMs = UNREAD_GRACE_MINUTES * 60_000;

  const [{ data: messages, error: msgError }, { data: reads }, { data: cases }] = await Promise.all([
    db.from("chat_messages").select("*").order("created_at"),
    db.from("chat_reads").select("*"),
    db.from("onboarding_cases").select("id, company_name, email, invite_token"),
  ]);

  if (msgError) {
    res.status(500).json({ error: `Could not read messages: ${msgError.message}` });
    return;
  }

  /* Who owes whom a read. For each (relationship, side), the unread set is the
     other side's messages after that side's marker. */
  const pending = new Map();
  for (const m of messages ?? []) {
    if (m.author_side === "system") continue;
    const recipientSide = m.author_side === "principal" ? "supplier" : "principal";
    const key = `${m.relationship_id}::${recipientSide}`;
    const marker = (reads ?? []).find(
      (r) => r.relationship_id === m.relationship_id && r.side === recipientSide
    );
    if (marker?.last_read_at && new Date(m.created_at) <= new Date(marker.last_read_at)) continue;

    const entry = pending.get(key) ?? {
      relationshipId: m.relationship_id,
      side: recipientSide,
      marker,
      count: 0,
      latest: m,
    };
    entry.count += 1;
    entry.latest = m;
    pending.set(key, entry);
  }

  const sent = [];
  const skipped = [];

  for (const entry of pending.values()) {
    // Still inside the grace window — give them a chance to read it themselves.
    const oldestAllowed = now - graceMs;
    if (new Date(entry.latest.created_at).getTime() > oldestAllowed) {
      skipped.push({ relationship: entry.relationshipId, side: entry.side, reason: "within grace window" });
      continue;
    }
    // Already told them about this streak; don't tell them again.
    if (entry.marker?.notified_at) {
      skipped.push({ relationship: entry.relationshipId, side: entry.side, reason: "already notified" });
      continue;
    }

    /* Only the supplier/prospect side is emailed in this prototype: the PM is
       looking at the app, and the Principal has no mailbox in the fiction. The
       address and the magic link both come from the onboarding case, so a
       prospect gets a link that logs them straight back in. */
    if (entry.side !== "supplier") {
      skipped.push({ relationship: entry.relationshipId, side: entry.side, reason: "principal side not emailed" });
      continue;
    }

    // `rel:<principalId>:<supplierId>` — see relationshipId() in src/lib/db.ts.
    const supplierId = entry.relationshipId.split(":")[2];
    const onbCase = (cases ?? []).find((c) => c.id === `onb-${supplierId}`);
    const to = onbCase?.email;
    if (!to) {
      skipped.push({ relationship: entry.relationshipId, side: entry.side, reason: "no email on file" });
      continue;
    }

    const origin = process.env.PUBLIC_ORIGIN || `https://${req.headers.host}`;
    const link = onbCase.invite_token ? `${origin}/?invite=${onbCase.invite_token}` : origin;
    const fromCompany = entry.latest.author_company;

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;">
        <p>Hello,</p>
        <p>
          You have <strong>${entry.count}</strong> new message${entry.count === 1 ? "" : "s"}
          from <strong>${escapeHtml(fromCompany)}</strong> on Lynk.
        </p>
        <p style="margin:16px 0;padding:12px 16px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#3f3f46;">
          ${escapeHtml(entry.latest.author_name)}: ${escapeHtml(entry.latest.body)}
        </p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
            Open the conversation
          </a>
        </p>
        <p style="color:#71717a;font-size:13px;">
          Or paste this link into your browser:<br />
          <a href="${link}" style="color:#71717a;">${link}</a>
        </p>
        <p style="color:#71717a;font-size:12px;margin-top:24px;">
          We'll only send this once — you won't hear from us again about these messages until you've read them.
        </p>
      </div>
    `;

    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || DEFAULT_FROM,
          to: [to],
          subject: `You have new messages from ${fromCompany}`,
          html,
        }),
      });
      const body = await resendRes.json();
      if (!resendRes.ok) {
        skipped.push({
          relationship: entry.relationshipId,
          side: entry.side,
          reason: body?.message || "Resend rejected the request",
        });
        continue;
      }

      /* Mark the streak as notified WITHOUT touching last_read_at — being
         emailed is not the same as having read it. */
      await db.from("chat_reads").upsert(
        {
          relationship_id: entry.relationshipId,
          side: entry.side,
          last_read_at: entry.marker?.last_read_at ?? new Date(0).toISOString(),
          notified_at: new Date().toISOString(),
        },
        { onConflict: "relationship_id,side" }
      );

      sent.push({ relationship: entry.relationshipId, to, count: entry.count, id: body.id });
    } catch (err) {
      skipped.push({
        relationship: entry.relationshipId,
        side: entry.side,
        reason: err instanceof Error ? err.message : "Unknown error sending email",
      });
    }
  }

  res.status(200).json({ graceMinutes: UNREAD_GRACE_MINUTES, sent, skipped });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
