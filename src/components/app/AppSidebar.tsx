import {
  LayoutDashboard, Users, ClipboardList, BarChart3, Settings, Pin, PinOff,
  CalendarDays, ListTodo, Sparkles, TrendingUp, ShieldCheck, Workflow, Plug,
  CreditCard, LifeBuoy, ChevronDown, UserPlus, UserCheck, GitBranch, ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useCallback } from "react";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useResolutionHubCount } from "@/hooks/useResolutionHubCount";

const primaryNav = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Advisor", url: "/advisor", icon: Sparkles },
  { title: "Revenue Intelligence", url: "/revenue-intel", icon: TrendingUp },
  { title: "AI Resolution Hub", url: "/resolution-hub", icon: ShieldCheck },
];

const crmSub = [
  { title: "Leads", url: "/ai-crm?tab=leads", icon: UserPlus },
  { title: "Customers", url: "/ai-crm?tab=customers", icon: UserCheck },
  { title: "Bookings", url: "/ai-crm?tab=bookings", icon: ClipboardList },
  { title: "Pipeline", url: "/ai-crm?tab=pipeline", icon: GitBranch },
  { title: "Tasks", url: "/ai-crm?tab=tasks", icon: ListTodo },
];

const tailNav = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Automations", url: "/automations", icon: Workflow },
  { title: "Integrations", url: "/integrations", icon: Plug },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "/support", icon: LifeBuoy },
];

const founderNav = [
  { title: "AI Advisor", url: "/founder?section=ai", icon: Sparkles },
];

const conditionalNav = [
  { title: "Calendar", url: "/dashboard?tab=calendar", icon: CalendarDays, industries: ["hospitality", "healthcare", "education", "events"] },
  { title: "Operations", url: "/dashboard?tab=operations", icon: ListTodo, industries: ["logistics", "railway", "car_rental", "airline"] },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [pinned, setPinned] = useState(false);
  const [crmOpen, setCrmOpen] = useState(currentPath === "/ai-crm" || currentPath === "/crm");
  const { profile } = useProfile();
  const { activeWorkspace } = useWorkspaces();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const hubCount = useResolutionHubCount();

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const userIndustry = (activeWorkspace?.industry as string) || profile?.industry || "";

  const visibleConditional = conditionalNav.filter(
    (item) => item.industries.includes(userIndustry)
  );

  const isActive = (url: string) => {
    if (url.includes("?")) return false;
    return currentPath === url;
  };

  const handleMouseEnter = useCallback(() => {
    if (!pinned) setOpen(true);
  }, [pinned, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!pinned) setOpen(false);
  }, [pinned, setOpen]);

  const togglePin = () => {
    setPinned(prev => {
      const next = !prev;
      setOpen(next);
      return next;
    });
  };

  const renderNavItem = (item: typeof primaryNav[0]) => {
    const isHub = item.url === "/resolution-hub";
    const hubBadgeNum = hubCount?.total_open ?? 0;
    const hubBadgeRed = (hubCount?.sherlock_active ?? 0) > 0;
    const showHubBadge = isHub && hubBadgeNum > 0;

    const button = (
      <SidebarMenuButton asChild isActive={isActive(item.url)}>
        <NavLink
          to={item.url}
          end
          className="hover:bg-muted/50 relative"
          activeClassName="bg-muted text-primary font-medium"
        >
          <item.icon className="mr-2 h-4 w-4" />
          {!collapsed && <span className="flex-1">{item.title}</span>}
          {showHubBadge && !collapsed && (
            <span
              className={`ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums text-white ${
                hubBadgeRed
                  ? "bg-red-500 animate-pulse"
                  : "bg-cyan-500"
              }`}
              aria-label={hubBadgeRed ? "Sherlock escalations active" : "Active issues"}
            >
              {hubBadgeNum}
            </span>
          )}
          {showHubBadge && collapsed && (
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background ${
                hubBadgeRed ? "bg-red-500 animate-pulse" : "bg-cyan-500"
              }`}
            />
          )}
        </NavLink>
      </SidebarMenuButton>
    );

    if (collapsed) {
      return (
        <SidebarMenuItem key={item.title}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    return <SidebarMenuItem key={item.title}>{button}</SidebarMenuItem>;
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-3 border-b border-border/50">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Logo size="sm" />
            {!collapsed && (
              <span className="text-lg font-extrabold bg-gradient-to-r from-[hsl(174,62%,55%)] via-[hsl(200,80%,65%)] to-[hsl(217,91%,60%)] bg-clip-text text-transparent">
                HostFlow AI
              </span>
            )}
          </button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNav.map(renderNavItem)}

                {/* CRM expandable group */}
                <SidebarMenuItem>
                  <Collapsible open={crmOpen} onOpenChange={setCrmOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={currentPath === "/ai-crm" || currentPath === "/crm"}>
                        <Users className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">AI CRM</span>
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${crmOpen ? "rotate-90" : ""}`} />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!collapsed && (
                      <CollapsibleContent>
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-border/50 pl-2">
                          {crmSub.map((s) => (
                            <NavLink
                              key={s.title}
                              to={s.url}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition"
                              activeClassName="text-primary font-medium"
                            >
                              <s.icon className="w-3.5 h-3.5" />
                              <span>{s.title}</span>
                            </NavLink>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </SidebarMenuItem>

                {tailNav.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {visibleConditional.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Industry</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleConditional.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Founder</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {founderNav.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        {!collapsed && (
          <SidebarFooter className="p-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground"
              onClick={togglePin}
            >
              {pinned ? <PinOff className="w-3.5 h-3.5 mr-2" /> : <Pin className="w-3.5 h-3.5 mr-2" />}
              {pinned ? "Unpin Sidebar" : "Pin Sidebar"}
            </Button>
          </SidebarFooter>
        )}
      </Sidebar>
    </div>
  );
}
