import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const industry = body.industry || "hospitality";

    // Calculate report for last month
    const now = new Date();
    const reportMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Check if report already exists
    const { data: existing } = await supabase
      .from("crm_performance_reports")
      .select("id")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .eq("report_month", reportMonth.toISOString().split("T")[0])
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Report already exists", id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all work sessions for the month
    const { data: sessions } = await supabase
      .from("crm_work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .gte("started_at", reportMonth.toISOString())
      .lte("started_at", monthEnd.toISOString())
      .not("ended_at", "is", null);

    const workSessions = (sessions || []).filter((s: any) => s.session_type === "work");
    const breakSessions = (sessions || []).filter((s: any) => s.session_type === "break");

    const totalWorkSeconds = workSessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
    const totalBreakSeconds = breakSessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
    const totalSessions = workSessions.length;
    const totalBreaks = breakSessions.length;

    const avgSessionMinutes = totalSessions > 0 ? Math.round((totalWorkSeconds / totalSessions) / 60 * 10) / 10 : 0;
    const longestSession = workSessions.reduce((max: number, s: any) => Math.max(max, s.duration_seconds || 0), 0);
    const longestSessionMinutes = Math.round(longestSession / 60 * 10) / 10;

    // Count unique active days
    const activeDays = new Set(workSessions.map((s: any) => new Date(s.started_at).toISOString().split("T")[0])).size;

    // Fetch tasks completed in the month
    const { data: tasks } = await supabase
      .from("crm_tasks")
      .select("id, status, completed_at, estimated_minutes")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .not("completed_at", "is", null)
      .gte("completed_at", reportMonth.toISOString())
      .lte("completed_at", monthEnd.toISOString());

    const tasksCompleted = (tasks || []).length;

    // Fetch activities count
    const { count: activitiesCount } = await supabase
      .from("crm_activities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("industry", industry)
      .gte("created_at", reportMonth.toISOString())
      .lte("created_at", monthEnd.toISOString());

    // Calculate productivity score (0-100)
    const workHours = totalWorkSeconds / 3600;
    const breakRatio = totalWorkSeconds > 0 ? totalBreakSeconds / totalWorkSeconds : 1;
    
    let score = 0;
    score += Math.min(activeDays / 22, 1) * 30; // 30 pts for attendance (22 working days)
    score += Math.min(workHours / (activeDays * 6 || 1), 1) * 25; // 25 pts for avg 6h/day work
    score += Math.min(1 - breakRatio, 1) * 15; // 15 pts for break efficiency
    score += Math.min(tasksCompleted / 20, 1) * 20; // 20 pts for tasks
    score += Math.min((activitiesCount || 0) / 30, 1) * 10; // 10 pts for activities
    score = Math.round(Math.min(score, 100));

    // Generate AI summary using Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiSummary = "";
    let aiRecommendations: string[] = [];

    if (lovableApiKey) {
      const monthName = reportMonth.toLocaleString("default", { month: "long", year: "numeric" });
      const prompt = `You are an AI performance analyst for a ${industry} business CRM. Generate a brief monthly performance report.

Data for ${monthName}:
- Total work time: ${Math.round(workHours * 10) / 10} hours across ${activeDays} days
- ${totalSessions} work sessions, avg ${avgSessionMinutes} min each, longest ${longestSessionMinutes} min
- ${totalBreaks} breaks taken, total break time: ${Math.round(totalBreakSeconds / 60)} minutes
- Break-to-work ratio: ${Math.round(breakRatio * 100)}%
- Tasks completed: ${tasksCompleted}
- Activities logged: ${activitiesCount || 0}
- Productivity score: ${score}/100

Respond in JSON format:
{"summary": "2-3 sentence performance summary", "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]}`;

      try {
        const aiRes = await fetch("https://ai.lovable.dev/chat/v1", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableApiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiSummary = parsed.summary || "";
          aiRecommendations = parsed.recommendations || [];
        }
      } catch (e) {
        console.error("AI generation failed:", e);
        aiSummary = `Monthly productivity score: ${score}/100. You worked ${Math.round(workHours)} hours across ${activeDays} days with ${tasksCompleted} tasks completed.`;
        aiRecommendations = ["Maintain consistent daily work hours", "Take regular breaks to stay productive", "Complete tasks on time"];
      }
    } else {
      aiSummary = `Monthly productivity score: ${score}/100. You worked ${Math.round(workHours)} hours across ${activeDays} days with ${tasksCompleted} tasks completed.`;
      aiRecommendations = ["Maintain consistent daily work hours", "Take regular breaks to stay productive", "Complete tasks on time"];
    }

    // Insert report
    const { data: report, error: insertError } = await supabase
      .from("crm_performance_reports")
      .insert({
        user_id: user.id,
        industry,
        report_month: reportMonth.toISOString().split("T")[0],
        total_work_seconds: totalWorkSeconds,
        total_break_seconds: totalBreakSeconds,
        total_sessions: totalSessions,
        total_breaks: totalBreaks,
        avg_session_minutes: avgSessionMinutes,
        longest_session_minutes: longestSessionMinutes,
        days_active: activeDays,
        productivity_score: score,
        ai_summary: aiSummary,
        ai_recommendations: aiRecommendations,
        metadata: { tasks_completed: tasksCompleted, activities_count: activitiesCount || 0 },
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
