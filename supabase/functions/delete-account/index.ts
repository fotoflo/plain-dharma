// Deletes the authenticated caller's account (App Store Guideline 5.1.1(v):
// in-app account deletion). The client invokes this with its session JWT; we
// verify it, then delete the auth user with the service role. The
// public.marginalia rows are removed automatically via
// `user_id ... references auth.users(id) on delete cascade`.
//
// Deploy: supabase functions deploy delete-account --project-ref <ref>
// (verify_jwt stays on — only a valid signed-in session can call it.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return json({ error: "Server is misconfigured" }, 500);
  }

  // Verify the caller's JWT and resolve their user id (token-scoped client).
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Invalid session" }, 401);

  // Delete the user with the service role — cascades to public.marginalia.
  const admin = createClient(url, serviceKey);
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ ok: true });
});
