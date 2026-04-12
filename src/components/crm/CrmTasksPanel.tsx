import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrmTasks } from "@/hooks/useCrmTasks";
import { Plus, CheckCircle2, Clock, AlertTriangle, Sparkles, Trash2, Calendar, ListTodo, Filter } from "lucide-react";
import { toast } from "sonner";
import type { IndustryType } from "@/lib/industryConfig";
import { getIndustryConfig } from "@/lib/industryConfig";
import { getCrmConfig } from "@/lib/crmConfig";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  industry: IndustryType;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  in_progress: <ListTodo className="h-4 w-4 text-blue-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

export default function CrmTasksPanel({ industry }: Props) {
  const { tasks, loading, addTask, updateTask, deleteTask, completeTask, reopenTask, todayTasks, pendingTasks, overdueTasks } = useCrmTasks();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "done">("all");
  const [aiLoading, setAiLoading] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", due_date: "", category: "general", estimated_minutes: "" });

  const industryConfig = getIndustryConfig(industry);
  const crmConfig = getCrmConfig(industry);

  const handleAdd = async () => {
    if (!newTask.title.trim()) { toast.error("Task title required"); return; }
    const result = await addTask({
      ...newTask,
      estimated_minutes: newTask.estimated_minutes ? parseInt(newTask.estimated_minutes) : undefined,
      due_date: newTask.due_date || undefined,
    });
    if (result?.error) { toast.error("Failed to add task"); return; }
    toast.success("Task added!");
    setNewTask({ title: "", description: "", priority: "medium", due_date: "", category: "general", estimated_minutes: "" });
    setShowAdd(false);
  };

  const handleAiOrganize = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-daily-planner", {
        body: { action: "organize_tasks", industry, tasks: pendingTasks.slice(0, 20) },
      });
      if (error) throw error;
      if (data?.organized_tasks) {
        for (const org of data.organized_tasks) {
          await updateTask(org.id, {
            ai_priority_score: org.ai_priority_score,
            ai_category: org.ai_category,
            ai_suggestions: org.ai_suggestions || [],
            sort_order: org.sort_order,
          });
        }
        toast.success("AI ne tasks organize kar diye!");
      }
    } catch {
      toast.error("AI organize nahi kar saka, try again");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredTasks = filter === "today" ? todayTasks
    : filter === "overdue" ? overdueTasks
    : filter === "done" ? tasks.filter(t => t.status === "done")
    : tasks.filter(t => t.status !== "done");

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter("all")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{pendingTasks.length}</p>
            <p className="text-xs text-muted-foreground">Active Tasks</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter("today")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{todayTasks.length}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter("overdue")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter("done")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === "done").length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title..." value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Description (optional)..." value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <Input type="number" placeholder="Est. minutes" value={newTask.estimated_minutes} onChange={e => setNewTask(p => ({ ...p, estimated_minutes: e.target.value }))} />
              <Button onClick={handleAdd} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button size="sm" variant="outline" onClick={handleAiOrganize} disabled={aiLoading || pendingTasks.length === 0}>
          <Sparkles className="h-4 w-4 mr-1" />{aiLoading ? "AI Organizing..." : "AI Auto-Organize"}
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Badge variant={filter === "all" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilter("all")}>All</Badge>
          <Badge variant={filter === "today" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilter("today")}>Today</Badge>
          <Badge variant={filter === "overdue" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilter("overdue")}>Overdue</Badge>
          <Badge variant={filter === "done" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilter("done")}>Done</Badge>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {filter === "all" ? "No active tasks. Add one to get started!" : `No ${filter} tasks.`}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => (
            <Card key={task.id} className={`transition-all ${task.status === "done" ? "opacity-60" : ""}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === "done"}
                    onCheckedChange={checked => checked ? completeTask(task.id) : reopenTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[task.priority] || ""}`}>
                        {task.priority}
                      </Badge>
                      {task.ai_priority_score != null && (
                        <Badge variant="secondary" className={`text-[10px] ${
                          task.ai_priority_score >= 80 ? "bg-red-500/10 text-red-600 border-red-500/20" :
                          task.ai_priority_score >= 50 ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                          ""
                        }`}>
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          Urgency: {task.ai_priority_score}
                        </Badge>
                      )}
                      {task.ai_category && (
                        <Badge variant="outline" className="text-[10px]">{task.ai_category}</Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${overdueTasks.some(o => o.id === task.id) ? "text-red-500 font-medium" : ""}`}>
                          <Calendar className="h-3 w-3" />{format(new Date(task.due_date), "MMM d")}
                        </span>
                      )}
                      {task.estimated_minutes && <span><Clock className="h-3 w-3 inline mr-0.5" />{task.estimated_minutes}m</span>}
                      {task.status !== "done" && STATUS_ICONS[task.status]}
                    </div>
                    {task.ai_suggestions && task.ai_suggestions.length > 0 && (
                      <div className="mt-1.5 p-1.5 bg-primary/5 rounded text-xs">
                        <Sparkles className="h-3 w-3 inline mr-1 text-primary" />
                        {typeof task.ai_suggestions[0] === "string" ? task.ai_suggestions[0] : JSON.stringify(task.ai_suggestions[0])}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteTask(task.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
