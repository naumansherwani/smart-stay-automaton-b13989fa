import { Inbox } from "lucide-react";

interface EmptyWorkspaceStateProps {
  entityName?: string;
}

export default function EmptyWorkspaceState({ entityName = "record" }: EmptyWorkspaceStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">No data yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Start by adding your first {entityName}. Your workspace is ready to go.
      </p>
    </div>
  );
}
