import {
  LayoutDashboard, Users, ClipboardList, BarChart3, Settings, Pin, PinOff,
  CalendarDays, ListTodo, Menu, X, Sparkles, TrendingUp, ShieldCheck,
  Workflow, Plug, CreditCard, LifeBuoy, ChevronRight, UserPlus, UserCheck, GitBranch,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useState, useCallback, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResolutionHubCount } from "@/hooks/useResolutionHubCount";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hostflow_sidebar_pinned";
const W_EXPANDED = 280;
const W_COLLAPSED = 72;

const primaryNav = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Advisor", url: "/advisor", icon: Sparkles },
  { title: "Revenue Intelligence", url: "/revenue-intel", icon: TrendingUp },
  { title: "AI Resolution Hub", url: "/resolution-hub", icon: ShieldCheck },
];

const crmSub = [
  { title: "Leads", url: "/crm?tab=leads", icon: UserPlus },
  { title: "Customers", url: "/crm?tab=customers", icon: UserCheck },
  { title: "Bookings", url: "/crm?tab=bookings", icon: ClipboardList },
  { title: "Pipeline", url: "/crm?tab=pipeline", icon: GitBranch },
  { title: "Tasks", url: "/crm?tab=tasks", icon: ListTodo },
];

const tailNav = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Automations", url: "/automations", icon: Workflow },
  { title: "Integrations", url: "/integrations", icon: Plug },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

const conditionalNav = [
  { title: "Calendar", url: "/dashboard?tab=calendar", icon: CalendarDays, industries: ["hospitality", "healthcare", "education", "events_entertainment"] },
  { title: "Operations", url: "/dashboard?tab=operations", icon: ListTodo, industries: ["logistics", "railways", "car_rental", "airlines"] },
];

export function GhostSidebar() {
  const isMobile = useIsMobile();
  const [pinned, setPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "true";
  });
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const { profile } = useProfile();
  const { activeWorkspace } = useWorkspaces();
  const hubCount = useResolutionHubCount();
  const currentPath = location.pathname;

  const userIndustry = (activeWorkspace?.industry as string) || profile?.industry || "";
  const visibleConditional = conditionalNav.filter(i => i.industries.includes(userIndustry));

  // Expanded when: mobile drawer open, pinned, or hovered (desktop unpinned)
  const expanded = isMobile ? mobileOpen : (pinned || hovered);
  const labelsVisible = expanded;

  // Sync CSS var so main content can shift
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobile) {
      document.documentElement.style.setProperty("--app-sidebar-w", "0px");
    } else {
      document.documentElement.style.setProperty(
        "--app-sidebar-w",
        `${pinned ? W_EXPANDED : W_COLLAPSED}px`
      );
    }
  }, [pinned, isMobile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(pinned));
  }, [pinned]);

  const isActive = (url: string) => {
    if (url.includes("?")) return false;
    return currentPath === url;
  };

  const handleMouseEnter = useCallback(() => {
    if (isMobile || pinned) return;
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setHovered(true);
  }, [isMobile, pinned]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile || pinned) return;
    hideTimeout.current = setTimeout(() => setHovered(false), 180);
  }, [isMobile, pinned]);

  const togglePin = () => setPinned(p => !p);

  const renderNavItem = (item: typeof primaryNav[0]) => {
    const isHub = item.url === "/resolution-hub";
    const hubBadgeNum = hubCount?.total_open ?? 0;
    const hubBadgeRed = (hubCount?.sherlock_active ?? 0) > 0;
    const showBadge = isHub && hubBadgeNum > 0;
    const active = isActive(item.url);

    const link = (
      <NavLink
        to={item.url}
        end
        className={cn(
          "relative text-sm transition-all duration-200 hover:bg-white/[0.08] hover:shadow-[0_0_12px_-2px_rgba(45,212,191,0.12)]",
          labelsVisible
            ? "flex items-center gap-3 px-3 py-2.5 rounded-lg"
            : "w-12 h-12 flex items-center justify-center rounded-[14px] mx-auto nav-rail-item",
          active && "ghost-sidebar-active"
        )}
        activeClassName=""
        onClick={() => isMobile && setMobileOpen(false)}
      >
        <item.icon className={cn("shrink-0", labelsVisible ? "h-[18px] w-[18px]" : "h-5 w-5")} />
        <span className={cn(
          "whitespace-nowrap transition-opacity duration-200",
          labelsVisible ? "opacity-100" : "hidden"
        )}>
          {item.title}
        </span>
        {showBadge && labelsVisible && (
          <span className={cn(
            "ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums text-white",
            hubBadgeRed ? "bg-red-500 animate-pulse" : "bg-cyan-500"
          )}>{hubBadgeNum}</span>
        )}
        {showBadge && !labelsVisible && (
          <span className={cn(
            "absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[hsl(var(--background))]",
            hubBadgeRed ? "bg-red-500 animate-pulse" : "bg-cyan-500"
          )} />
        )}
      </NavLink>
    );

    if (!labelsVisible && !isMobile) {
      return (
        <TooltipProvider key={item.title} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right" className="bg-card text-foreground border-border">
              {item.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <div key={item.title}>{link}</div>;
  };

  const renderCrmGroup = () => {
    const crmBtn = (
      <button
        onClick={() => labelsVisible ? setCrmOpen(o => !o) : setPinned(true)}
        className={cn(
          "text-sm transition-all duration-200 hover:bg-white/[0.08] hover:shadow-[0_0_12px_-2px_rgba(45,212,191,0.12)]",
          labelsVisible
            ? "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg"
            : "w-12 h-12 flex items-center justify-center rounded-[14px] mx-auto nav-rail-item",
          currentPath === "/crm" && "ghost-sidebar-active"
        )}
      >
        <Users className={cn("shrink-0", labelsVisible ? "h-[18px] w-[18px]" : "h-5 w-5")} />
        <span className={cn("flex-1 text-left whitespace-nowrap transition-opacity", labelsVisible ? "opacity-100" : "hidden")}>CRM</span>
        {labelsVisible && <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", crmOpen && "rotate-90")} />}
      </button>
    );
    return (
      <div>
        {!labelsVisible && !isMobile ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>{crmBtn}</TooltipTrigger>
              <TooltipContent side="right" className="bg-card text-foreground border-border">CRM</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : crmBtn}
        {labelsVisible && crmOpen && (
          <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
            {crmSub.map((s) => (
              <NavLink
                key={s.title}
                to={s.url}
                className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-md transition"
                activeClassName="text-white"
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span>{s.title}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Mobile: hamburger + drawer
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-[60] rounded-full bg-card/80 backdrop-blur"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-[54] backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        )}

        <aside
          className={cn(
            "fixed top-0 left-0 h-full z-[55] w-[280px] ghost-sidebar-bg p-4 flex flex-col gap-1 overflow-y-auto",
            "transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={() => {
              setMobileOpen(false);
              window.dispatchEvent(new CustomEvent("toggle-public-view"));
            }}
            className="flex items-center gap-2 mb-6 mt-1 px-1 hover:opacity-80 transition-opacity"
          >
            <Logo size="sm" />
            <span className="text-base font-bold text-white/90">HostFlow AI</span>
          </button>
          <nav className="flex flex-col gap-0.5">{primaryNav.map(renderNavItem)}</nav>
          {renderCrmGroup()}
          <nav className="flex flex-col gap-0.5 mt-1">{tailNav.map(renderNavItem)}</nav>
          {visibleConditional.length > 0 && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-4 mb-1 px-3">Industry</div>
              <nav className="flex flex-col gap-0.5">{visibleConditional.map(renderNavItem)}</nav>
            </>
          )}
        </aside>
      </>
    );
  }

  // Desktop
  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: expanded ? W_EXPANDED : W_COLLAPSED }}
      className={cn(
        "fixed top-0 left-0 h-full z-[55] flex flex-col ghost-sidebar-bg overflow-hidden",
        "transition-[width] duration-300 ease-in-out",
        "shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]",
        expanded ? "px-3 py-4" : "px-0 py-3 items-center"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center min-h-[48px]", expanded ? "justify-between px-1 mb-5" : "justify-center w-full mb-3 h-[48px]")}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-public-view"))}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Switch to Public View"
        >
          <Logo size="sm" />
          {expanded && <span className="text-sm font-bold text-white/90 whitespace-nowrap">HostFlow AI</span>}
        </button>
        {expanded && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10"
            onClick={togglePin}
            title={pinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        expanded ? "-mx-1 px-1 w-full" : "w-full flex flex-col items-center"
      )}>
        <nav className={cn("flex flex-col w-full", expanded ? "gap-0.5" : "items-center gap-2")}>
          {primaryNav.map(renderNavItem)}
        </nav>
        {renderCrmGroup()}
        <nav className={cn("flex flex-col w-full mt-1", expanded ? "gap-0.5" : "items-center gap-2")}>
          {tailNav.map(renderNavItem)}
        </nav>

        {visibleConditional.length > 0 && (
          <>
            {expanded && (
              <div className="text-[10px] uppercase tracking-widest text-white/30 mt-5 mb-1 px-3">Industry</div>
            )}
            <nav className={cn("flex flex-col w-full", expanded ? "gap-0.5" : "items-center gap-2 mt-3")}>
              {visibleConditional.map(renderNavItem)}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}
