import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntNotes } from "@/hooks/useEnterpriseCrm";

export default function EntNotes() {
  const { data, refetch } = useEntNotes();
  const [body, setBody] = useState("");

  const add = async () => {
    if (!body.trim()) return;
    const { error } = await supabase.from("ent_notes").insert({ body });
    if (error) toast.error("Failed"); else { setBody(""); refetch(); toast.success("Note added"); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ent_notes").delete().eq("id", id);
    if (error) toast.error("Delete failed"); else refetch();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Quick note for the sales team…" rows={3} />
          <div className="flex justify-end"><Button size="sm" onClick={add} disabled={!body.trim()}>Add Note</Button></div>
        </CardContent>
      </Card>

      {data.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No notes yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.map((n) => (
            <Card key={n.id} className="hover:border-primary/40 transition">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <StickyNote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm flex-1 whitespace-pre-wrap">{n.body}</p>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(n.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <div className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}