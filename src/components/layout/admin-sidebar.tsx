"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Package,
  Bell,
  Settings,
  Key,
  UserCog,
  LogOut,
  FileText,
  ShoppingBag,
  BarChart3,
  CreditCard,
  Truck,
  MessageSquare,
  Cookie,
  ChevronRight,
  ChevronsUpDown,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  permission?: string;
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { admin, logout, hasPermission } = useAuth();
  const pathname = usePathname();

  // Early return if auth context is not ready
  if (!hasPermission) {
    return (
      <Sidebar {...props}>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">B</span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Benzochem</span>
              <span className="truncate text-xs">Admin</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingBag,
      badge: "12",
    },
    {
      title: "Products",
      icon: Package,
      permission: "products.read",
      children: [
        {
          title: "All products",
          href: "/dashboard/products",
          icon: Package,
          permission: "products.read",
        },
        {
          title: "Collections",
          href: "/dashboard/products/collections",
          icon: Package,
          permission: "products.read",
        },
        {
          title: "Inventory",
          href: "/dashboard/products/inventory",
          icon: Package,
          permission: "products.read",
        },
      ],
    },
    {
      title: "Customers",
      icon: Users,
      permission: "users.read",
      children: [
        {
          title: "All customers",
          href: "/dashboard/users",
          icon: Users,
          permission: "users.read",
        },
        {
          title: "Pending approvals",
          href: "/dashboard/users/pending",
          icon: Users,
          badge: "3",
          permission: "users.approve",
        },
        {
          title: "Segments",
          href: "/dashboard/users/segments",
          icon: Users,
          permission: "users.read",
        },
      ],
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "Marketing",
      href: "/dashboard/marketing",
      icon: MessageSquare,
    },
    {
      title: "Discounts",
      href: "/dashboard/discounts",
      icon: CreditCard,
    },
    {
      title: "Quotations",
      href: "/dashboard/quotations",
      icon: FileText,
      permission: "quotations.read",
    },
    {
      title: "Settings",
      icon: Settings,
      permission: "settings.read",
      children: [
        {
          title: "General",
          href: "/dashboard/settings",
          icon: Settings,
          permission: "settings.read",
        },
        {
          title: "Cookie Consent",
          href: "/dashboard/cookie-consent",
          icon: Cookie,
          permission: "cookie-consent:read",
        },
        {
          title: "Notifications",
          href: "/dashboard/settings/notifications",
          icon: Bell,
          permission: "settings.write",
        },
        {
          title: "Shipping",
          href: "/dashboard/settings/shipping",
          icon: Truck,
          permission: "settings.read",
        },
        {
          title: "API Keys",
          href: "/dashboard/api-keys",
          icon: Key,
          permission: "api_keys.read",
        },
        {
          title: "Staff accounts",
          href: "/dashboard/admins",
          icon: UserCog,
          permission: "admins.read",
        },
      ],
    },
  ];

  const filteredNavItems = navItems.filter(item =>
    !item.permission || (hasPermission && hasPermission(item.permission))
  );

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.href ? pathname === item.href : false;
    const hasItemPermission = !item.permission || (hasPermission && hasPermission(item.permission));

    if (!hasItemPermission) return null;

    const filteredChildren = item.children?.filter(child =>
      !child.permission || (hasPermission && hasPermission(child.permission))
    );

    if (hasChildren && (!filteredChildren || filteredChildren.length === 0)) {
      return null;
    }

    if (hasChildren) {
      return (
        <Collapsible key={item.title} asChild defaultOpen={false}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title}>
                <item.icon />
                <span>{item.title}</span>
                {item.badge && (
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                )}
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {filteredChildren?.map((child) => (
                  <SidebarMenuSubItem key={child.title}>
                    <SidebarMenuSubButton asChild isActive={pathname === child.href}>
                      <Link href={child.href!}>
                        <child.icon />
                        <span>{child.title}</span>
                        {child.badge && (
                          <Badge variant="secondary" className="ml-auto">
                            {child.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
          <Link href={item.href!}>
            <item.icon />
            <span>{item.title}</span>
            {item.badge && (
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-sm font-bold">B</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Benzochem</span>
                    <span className="truncate text-xs">Admin Dashboard</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Admin Panel
                </DropdownMenuLabel>
                <DropdownMenuItem>
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-primary-foreground text-xs">
                      B
                    </div>
                    <div className="grid flex-1">
                      <span className="font-medium">Benzochem Industries</span>
                      <span className="text-xs text-muted-foreground">Admin Dashboard</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {admin?.firstName?.[0]}{admin?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {admin?.firstName} {admin?.lastName}
                    </span>
                    <span className="truncate text-xs">{admin?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {admin?.firstName?.[0]}{admin?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {admin?.firstName} {admin?.lastName}
                      </span>
                      <span className="truncate text-xs">{admin?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}