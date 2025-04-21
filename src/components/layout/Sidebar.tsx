
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  PieChart,
  Tags,
  Settings,
  User,
  ChevronRight,
  ChevronLeft,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Expenses",
      href: "/expenses",
      icon: FileText,
    },
    {
      name: "Categories",
      href: "/categories",
      icon: Tags,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: PieChart,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300",
      collapsed ? "w-[70px]" : "w-[240px]"
    )}>
      <div className="flex flex-col">
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-gray-200",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && <div className="text-xl font-bold text-expense-primary">ExpenseX</div>}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                pathname === item.href 
                  ? "bg-expense-primary text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-2">
        <Button
          variant="ghost" 
          className={cn(
            "w-full justify-start px-3 py-2 text-gray-600 hover:bg-gray-100",
            collapsed ? "justify-center" : ""
          )}
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </div>
  );
}
