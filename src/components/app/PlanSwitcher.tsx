import { useViewAsPlan, type ViewAsPlan } from "@/hooks/useViewAsPlan";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, Check, X } from "lucide-react";
import { toast } from "sonner";

const PLAN_LABEL: Record<NonNullable<ViewAsPlan>, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

export default function PlanSwitcher() {
  const { plan, setPlan, clear, isAdmin } = useViewAsPlan();

  // Hard guard: never render for non-admins, even if accidentally mounted.
  if (!isAdmin) return null;

  const active = plan !== null;
  const label = active ? `Viewing: ${PLAN_LABEL[plan!]}` : "View as user";

  const choose = (next: NonNullable<ViewAsPlan>) => {
    setPlan(next);
    toast.success(`Now viewing the app as a ${PLAN_LABEL[next]} user`);
    // Reload-free; hooks re-render automatically via storage listener.
  };

  const exit = () => {
    clear();
    toast.success("Returned to Owner view");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 text-xs font-medium transition-all ${
            active
              ? "bg-[hsl(168_70%_38%)]/15 text-[hsl(168_70%_45%)] border border-[hsl(168_70%_38%)]/40 hover:bg-[hsl(168_70%_38%)]/25 hover:text-white"
              : "hover:bg-primary/10"
          }`}
          title="Preview the app as a paying user (admin only)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          View app as user
          <p className="text-[10px] font-normal text-muted-foreground mt-0.5">
            Admin-only · UI preview · billing untouched
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["basic", "standard", "premium"] as const).map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() => choose(p)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{PLAN_LABEL[p]} plan</span>
            {plan === p && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={exit}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Exit to Owner view
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Thin amber banner shown app-wide when a view-as preview is active.
 * Mount once high in the tree (AppLayout) — it self-hides when no override.
 */
export function PlanSwitcherBanner() {
  const { plan, clear, isAdmin } = useViewAsPlan();
  if (!isAdmin || !plan) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs px-4 py-1.5 flex items-center justify-center gap-3">
      <Eye className="w-3.5 h-3.5" />
      <span>
        Previewing as <strong>{PLAN_LABEL[plan]}</strong> user — your real account
        is unchanged.
      </span>
      <button
        onClick={clear}
        className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 font-medium"
      >
        Exit
      </button>
    </div>
  );
}