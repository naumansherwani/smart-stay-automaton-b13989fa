import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import IndustryIcon from "./IndustryIcon";
import { Briefcase } from "lucide-react";

const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspaces();

  if (!activeWorkspace || workspaces.length === 0) return null;

  return (
    <Select
      value={activeWorkspace.id}
      onValueChange={switchWorkspace}
    >
      <SelectTrigger className="w-[240px] bg-card border-border">
        <SelectValue>
          <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span className="font-medium truncate">Workspace: {activeWorkspace.name}</span>
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
      </SelectContent>
    </Select>
  );
};

export default WorkspaceSwitcher;
