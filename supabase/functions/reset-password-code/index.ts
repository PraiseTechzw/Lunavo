import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hashBuf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateCode(): string {
  // 8-digit numeric code
  let code = "";
  for (let i = 0; i < 8; i++) code += Math.floor(Math.random() * 10).toString();
  return code;
}

async function sendEmail(to: string, subject: string, content: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to, subject, text: content }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn("send-email failed:", res.status, text);
  }
}

serve(async (req) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(
        {
          error: "Missing environment variables",
          details:
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for this function",
        },
        500,
      );
    }
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { action, email, code, newPassword } = body ?? {};
    if (!action || !email || typeof email !== "string") {
      return json({ error: "Invalid payload" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // -------------------------
    // REQUEST RESET CODE
    // -------------------------
    if (action === "request") {
      // Ensure the account exists before issuing a code
      const { data: listReq, error: listReqErr } =
        await supabase.auth.admin.listUsers();
      if (listReqErr) {
        return json(
          {
            error: "User listing failed",
            details: String(listReqErr?.message || listReqErr),
          },
          500,
        );
      }
      const exists = (listReq?.users || []).some(
        (u: any) => (u.email || "").toLowerCase() === normalizedEmail,
      );
      if (!exists) {
        return json({ error: "User not found" }, 404);
      }

      const c = generateCode();
      const hash = await hashCode(c);
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { error } = await supabase.from("password_reset_codes").insert({
        email: normalizedEmail,
        code_hash: hash,
        expires_at: expires,
      });
      if (error) {
        return json(
          {
            error: "Failed to store reset code",
            details: String(error?.message || error),
          },
          500,
        );
      }

      await sendEmail(
        normalizedEmail,
        "Your PEACE reset code",
        `Use this code to reset your password: ${c}\nIt expires in 15 minutes.`,
      );

      return json({ ok: true });
    }

    // -------------------------
    // VERIFY CODE + RESET PASSWORD
    // -------------------------
    if (action === "verify") {
      if (!code || !newPassword) {
        return json({ error: "Missing code or newPassword" }, 400);
      }

      const hash = await hashCode(String(code));
      const nowIso = new Date().toISOString();

      const { data: rows, error: selErr } = await supabase
        .from("password_reset_codes")
        .select("id, code_hash, expires_at, used_at, created_at")
        .eq("email", normalizedEmail)
        .is("used_at", null)
        .gte("expires_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1);

      if (selErr) {
        return json(
          {
            error: "Failed to query reset code",
            details: String(selErr?.message || selErr),
          },
          500,
        );
      }

      const entry = rows?.[0];
      if (!entry || entry.code_hash !== hash) {
        return json({ error: "Invalid or expired code" }, 400);
      }

      // Find auth user by email (Admin)
      const { data: list, error: listErr } =
        await supabase.auth.admin.listUsers();
      if (listErr) {
        return json(
          {
            error: "User listing failed",
            details: String(listErr?.message || listErr),
          },
          500,
        );
      }
      if (listErr) throw listErr;

      const found = (list?.users || []).find(
        (u: any) => (u.email || "").toLowerCase() === normalizedEmail,
      );

      if (!found) {
        return json({ error: "User not found" }, 404);
      }
      const { error: updErr } = await supabase.auth.admin.updateUserById(
        found.id,
        { password: String(newPassword) },
      );
      if (updErr) {
        return json(
          {
            error: "Failed to update password",
            details: String(updErr?.message || updErr),
          },
          500,
        );
      }

      const { error: useErr } = await supabase
        .from("password_reset_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", entry.id);
      if (useErr) {
        return json(
          {
            error: "Failed to mark code as used",
            details: String(useErr?.message || useErr),
          },
          500,
        );
      }

      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("reset-password error:", err);
    return json(
      { error: "Server error", details: String((err as any)?.message || err) },
      500,
    );
  }
});
