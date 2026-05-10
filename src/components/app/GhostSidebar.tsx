import {
  LayoutDashboard, Users, ClipboardList, BarChart3, Settings, Pin, PinOff,
  CalendarDays, ListTodo, Menu, X, Sparkles, TrendingUp, ShieldCheck,
  Workflow, Plug, CreditCard, LifeBuoy, ChevronRight, UserPlus, UserCheck, GitBranch,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useState, useCallback, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;

  const userIndustry = profile?.industry || "";
  const visibleConditional = conditionalNav.filter(i => i.industries.includes(userIndustry));

  const isActive = (url: string) => {
    if (url.includes("?")) return false;
    return currentPath === url;
  };

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setExpanded(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile || pinned) return;
    hideTimeout.current = setTimeout(() => setExpanded(false), 250);
  }, [isMobile, pinned]);

  const togglePin = () => {
    setPinned(prev => {
      if (prev) setExpanded(false);
      return !prev;
    });
  };

  const isOpen = pinned || expanded || mobileOpen;

  const renderNavItem = (item: typeof primaryNav[0]) => (
    <TooltipProvider key={item.title} delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={item.url}
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              "hover:bg-white/10",
              isActive(item.url) && "ghost-sidebar-active"
            )}
            activeClassName=""
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className={cn(
              "whitespace-nowrap transition-all duration-200",
              isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
            )}>
              {item.title}
            </span>
          </NavLink>
        </TooltipTrigger>
        {!isOpen && !isMobile && (
          <TooltipContent side="right" className="bg-card text-foreground border-border">
            {item.title}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  const renderCrmGroup = () => (
    <div className="min-w-[200px]">
      <button
        onClick={() => setCrmOpen(o => !o)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:bg-white/10",
          currentPath === "/crm" && "ghost-sidebar-active"
        )}
      >
        <Users className="h-[18px] w-[18px] shrink-0" />
        <span className={cn("flex-1 text-left whitespace-nowrap transition-all", isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>CRM</span>
        {isOpen && <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", crmOpen && "rotate-90")} />}
      </button>
      {isOpen && crmOpen && (
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

  // Mobile: hamburger button rendered separately
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-[60] rounded-full"
          onClick={() => setMobileOpen(o => !o)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-[54] backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar panel */}
        <aside
          className={cn(
            "fixed top-0 left-0 h-full z-[55] w-64 ghost-sidebar-bg p-4 flex flex-col gap-1",
            "transition-transform duration-250 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={() => {
              setMobileOpen(false);
              window.dispatchEvent(new CustomEvent("toggle-public-view"));
            }}
            className="flex items-center gap-2 mb-6 mt-1 px-1 hover:opacity-80 transition-opacity"
            title="Switch to Public View"
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

  // Desktop: ghost sidebar
  return (
    <>
      {/* Thin edge hint — always visible when not expanded */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-[55] transition-opacity duration-300",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onMouseEnter={handleMouseEnter}
      >
        <div className="w-[4px] h-full ghost-edge-glow" />
      </div>

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-[55] flex flex-col ghost-sidebar-bg",
          "transition-all duration-250 ease-in-out",
          "shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)]",
          isOpen ? "w-56 px-3 py-4 opacity-100 translate-x-0" : "w-0 px-0 py-4 opacity-0 -translate-x-2"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-1 min-w-[200px]">
          <button
            onClick={() => {
              // Dispatch custom event to toggle public view
              window.dispatchEvent(new CustomEvent("toggle-public-view"));
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Switch to Public View"
          >
            <Logo size="sm" />
            <span className="text-sm font-bold text-white/90 whitespace-nowrap">HostFlow AI</span>
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10" onClick={togglePin}>
            {pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 min-w-[200px]">
          {primaryNav.map(renderNavItem)}
        </nav>
        {renderCrmGroup()}
        <nav className="flex flex-col gap-0.5 min-w-[200px] mt-1">
          {tailNav.map(renderNavItem)}
        </nav>

        {visibleConditional.length > 0 && (
          <>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-5 mb-1 px-3 min-w-[200px]">Industry</div>
            <nav className="flex flex-col gap-0.5 min-w-[200px]">
              {visibleConditional.map(renderNavItem)}
            </nav>
          </>
        )}
      </aside>
    </>
  );
}
