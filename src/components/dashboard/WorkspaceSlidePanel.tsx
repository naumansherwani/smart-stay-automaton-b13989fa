import { useState } from "react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";
import IndustryIcon from "./IndustryIcon";
import AddIndustryDialog from "./AddIndustryDialog";
import { Plus, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WorkspaceSlidePanel = () => {
  const { workspaces, activeWorkspace, loading, switchWorkspace } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (loading || !activeWorkspace) return null;

  const handleSwitch = (id: string) => {
    switchWorkspace(id);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button showing active workspace */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/25 hover:border-primary/40 hover:shadow-md transition-all duration-300"
      >
        <IndustryIcon industry={activeWorkspace.industry} size={18} />
        <span className="font-semibold text-sm truncate max-w-[160px]">{activeWorkspace.name}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide panel from right */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-[61] w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl",
          "flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-base font-bold">Switch Industry</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Workspace list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {workspaces.map(ws => {
            const config = INDUSTRY_CONFIGS[ws.industry];
            const isActive = ws.id === activeWorkspace.id;

            return (
              <button
                key={ws.id}
                onClick={() => handleSwitch(ws.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                  "hover:bg-primary/10 hover:shadow-sm",
                  isActive
                    ? "bg-primary/15 border border-primary/30 shadow-sm"
                    : "border border-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                  isActive ? "bg-primary/20" : "bg-muted"
                )}>
                  <IndustryIcon industry={ws.industry} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{ws.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{config?.label || ws.industry}</div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Add industry button */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              setShowAddDialog(true);
              setOpen(false);
            }}
          >
            <Plus className="w-4 h-4" />
            Add Industry
          </Button>
        </div>
      </aside>

      <AddIndustryDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  );
};

export default WorkspaceSlidePanel;
