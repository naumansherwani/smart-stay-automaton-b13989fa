import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings, Pin, PinOff, CalendarDays, ListTodo } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";

const primaryNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Advanced AI CRM", url: "/crm", icon: Users },
  { title: "Bookings", url: "/dashboard?tab=bookings", icon: ClipboardList },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
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
  const { profile } = useProfile();

  const userIndustry = profile?.industry || "";

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
    const button = (
      <SidebarMenuButton asChild isActive={isActive(item.url)}>
        <NavLink
          to={item.url}
          end
          className="hover:bg-muted/50"
          activeClassName="bg-muted text-primary font-medium"
        >
          <item.icon className="mr-2 h-4 w-4" />
          {!collapsed && <span>{item.title}</span>}
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
