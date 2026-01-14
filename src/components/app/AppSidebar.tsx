"use client";

import { NavLink } from "@/components/NavLink";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Layers,
  PiggyBank,
  TrendingUp,
  HandCoins,
  ArrowDownToLine,
  ArrowUpToLine,
  ReceiptText,
  Settings,
  BookText,
  Github,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Logo from "@/components/Logo";

const menuItems: { title: string; url: string; end?: boolean; icon: LucideIcon }[] = [
  { title: "Dashboard", url: "/app", end: true, icon: LayoutDashboard },
  { title: "Pools", url: "/app/pools", icon: Layers },
  { title: "Deposit", url: "/app/deposit", icon: PiggyBank },
  { title: "Allocate capital", url: "/app/allocate", icon: TrendingUp },
  { title: "Borrow", url: "/app/borrow", icon: HandCoins },
  { title: "Withdraw", url: "/app/withdraw", icon: ArrowUpToLine },
  { title: "Repay / Settle", url: "/app/repay", icon: ReceiptText },
  { title: "Settlement records", url: "/app/records", icon: ArrowDownToLine },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

const resourcesItems: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "Documentation", url: "https://docs.cylend.xyz", icon: BookText },
  { title: "GitHub", url: "https://github.com/Ah-Riz/cylend_fe", icon: Github },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div
          className={
            isCollapsed
              ? "h-14 md:h-16 px-3 border-b border-border flex items-center justify-center"
              : "h-14 md:h-16 px-4 md:px-6 border-b border-border flex items-center"
          }
        >
          <div className={isCollapsed ? "flex items-center justify-center" : "flex items-center gap-3"}>
            <Logo className="h-6 w-auto flex-shrink-0" variant="secondary" />
            {!isCollapsed && (
              <span className="text-lg font-semibold text-foreground">
                Cylend Protocol
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={
                        isCollapsed
                          ? "flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          : "flex items-center gap-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      }
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Resources
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourcesItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        isCollapsed
                          ? "flex items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          : "flex items-center gap-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
