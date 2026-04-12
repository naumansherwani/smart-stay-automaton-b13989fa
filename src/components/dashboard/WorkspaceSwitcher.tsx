import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import IndustryIcon from "./IndustryIcon";
import { Briefcase, Plus } from "lucide-react";
import AddIndustryDialog from "./AddIndustryDialog";

const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspace, loading, switchWorkspace } = useWorkspaces();
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (loading || !activeWorkspace) return null;

  const handleValueChange = (value: string) => {
    if (value === "__add_industry__") {
      setShowAddDialog(true);
      return;
    }
    switchWorkspace(value);
  };

  return (
    <>
      <Select value={activeWorkspace.id} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[260px] bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/25 rounded-full h-9 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
          <SelectValue>
            <span className="flex items-center gap-2">
              <IndustryIcon industry={activeWorkspace.industry} size={16} />
              <span className="font-semibold text-sm truncate">{activeWorkspace.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {workspaces.map(ws => (
            <SelectItem key={ws.id} value={ws.id}>
              <span className="flex items-center gap-2">
                <IndustryIcon industry={ws.industry} size={16} />
                <span>{ws.name}</span>
              </span>
            </SelectItem>
          ))}
          <SelectItem value="__add_industry__">
            <span className="flex items-center gap-2 text-primary font-medium">
              <Plus className="w-4 h-4" />
              <span>Add Industry</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <AddIndustryDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </>
  );
};

export default WorkspaceSwitcher;
