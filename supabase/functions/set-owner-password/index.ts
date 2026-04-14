import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const email = "naumansherwani@hostflowai.live";
  const newPassword = "HostFlow@2025!";

  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u: any) => u.email === email);

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  const { error } = await supabase.auth.admin.updateUser(user.id, { password: newPassword });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, message: "Password updated" }), {
    headers: { "Content-Type": "application/json" },
  });
});
