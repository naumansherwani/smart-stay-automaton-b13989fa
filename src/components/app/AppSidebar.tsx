import { LayoutDashboard, Users, ClipboardList, BarChart3, Settings, DollarSign, Star, Pin, PinOff } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { useProfile } from "@/hooks/useProfile";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";
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
import { useState, useCallback } from "react";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "CRM", url: "/crm", icon: Users },
  { title: "Bookings", url: "/dashboard?tab=bookings", icon: ClipboardList },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const secondaryNav = [
  { title: "Earnings", url: "/earnings", icon: DollarSign },
  { title: "Reviews", url: "/reviews", icon: Star },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { profile } = useProfile();
  const [pinned, setPinned] = useState(false);

  const industryLabel = profile?.industry
    ? INDUSTRY_CONFIGS[profile.industry]?.label || profile.industry
    : "Loading...";

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

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Sidebar collapsible="icon" defaultOpen={false}>
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

          {/* Workspace label */}
          {!collapsed && (
            <div className="mt-3 px-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Workspace</p>
              <p className="text-xs font-medium text-foreground/80 truncate mt-0.5">{industryLabel}</p>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                    >
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
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>More</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                    >
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
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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
