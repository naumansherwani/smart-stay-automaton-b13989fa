import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const email = "naumansherwani@hostflowai.live";
  const newPassword = "HostFlow@2025!";

  // First try to find the user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u: any) => u.email === email);

  if (user) {
    // Update password
    const { error } = await supabase.auth.admin.updateUser(user.id, { password: newPassword });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ success: true, action: "password_updated" }));
  }

  // Create user if not found
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: newPassword,
    email_confirm: true,
    user_metadata: { full_name: "Nauman Sherwani" },
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, action: "user_created", id: newUser.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
