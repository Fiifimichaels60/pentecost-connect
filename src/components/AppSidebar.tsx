import { useState, useEffect } from "react"
import { 
  MessageSquare, 
  Users, 
  UserCheck, 
  Calendar, 
  Cake, 
  FileText, 
  History, 
  Settings,
  Home,
  Shield
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useAdminPermissions } from "@/hooks/useAdminPermissions"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, permission: "dashboard" },
  { title: "Compose", url: "/compose", icon: MessageSquare, permission: "compose" },
  { title: "Groups", url: "/groups", icon: Users, permission: "groups" },
  { title: "Members", url: "/members", icon: UserCheck, permission: "members" },
  { title: "Attendance", url: "/attendance", icon: Calendar, permission: "attendance" },
  { title: "Birthday", url: "/birthday", icon: Cake, permission: "birthday" },
  { title: "Templates", url: "/templates", icon: FileText, permission: "templates" },
  { title: "History", url: "/history", icon: History, permission: "history" },
  { title: "Admin Management", url: "/admin-management", icon: Shield, permission: "admin_management" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "settings" },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const { hasPermission, isSuperAdmin, loading } = useAdminPermissions()

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-primary text-primary-foreground font-medium shadow-sm" 
      : "hover:bg-accent hover:text-accent-foreground transition-colors"

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    // Super admin sees everything
    if (isSuperAdmin) return true;
    
    // Regular admins need specific permissions
    // If not authenticated or not an admin, show no menu items
    if (!hasPermission(item.permission)) return false;
    
    return true;
  });

  if (loading) {
    return (
      <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {!isCollapsed && (
          <div className="flex flex-col space-y-1">
            <h2 className="text-lg font-bold text-primary">COP SMS</h2>
            <p className="text-sm text-muted-foreground">Anaji English Assembly</p>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavCls(item.url)}>
                    <NavLink to={item.url} end={item.url === "/"}>
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
    </Sidebar>
  )
}