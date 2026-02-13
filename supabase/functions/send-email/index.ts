import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return json({ error: "Missing RESEND_API_KEY" }, 500);
    }
    const defaultFrom =
      Deno.env.get("RESEND_FROM") || "notifications@peace.praisetech.tech";
    const defaultReplyTo = Deno.env.get("RESEND_REPLY_TO") || undefined;

    let payloadBody: any;
    try {
      payloadBody = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    const { to, subject, html, text, from, cc, bcc, reply_to } = payloadBody;
    if (!to || !subject || (!html && !text)) {
      return json({ error: "Invalid payload" }, 400);
    }

    const toList = Array.isArray(to) ? to : [to];
    const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;

    const payload = {
      from: from || defaultFrom,
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject,
      html,
      text,
      reply_to: reply_to || defaultReplyTo,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return json(data, res.ok ? 200 : res.status);
  } catch (e) {
    return json({ error: "Server error" }, 500);
  }
});
