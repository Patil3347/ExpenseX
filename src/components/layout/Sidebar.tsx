import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  PieChart,
  Tags,
  Users,
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
      name: "Groups",
      href: "/groups",
      icon: Users,
      isHighlighted: true,
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
    }
  ];

  return (
    <div className={cn(
      "h-screen bg-[#2D2D2D] border-r border-[#3A3A3A] flex flex-col justify-between transition-all duration-300",
      collapsed ? "w-[70px]" : "w-[240px]"
    )}>
      <div className="flex flex-col">
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-[#3A3A3A]",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && <div className="text-xl font-bold text-primary">ExpenseX</div>}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-gray-300 hover:text-white hover:bg-[#3A3A3A]"
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
                  ? "bg-primary text-white font-medium shadow-md shadow-primary/30" 
                  : item.isHighlighted
                    ? "text-white hover:bg-primary/20 hover:text-white border-l-2 border-primary"
                    : "text-gray-300 hover:bg-[#3A3A3A] hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                item.isHighlighted && pathname !== item.href ? "text-primary" : ""
              )} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-2">
        <Button
          variant="ghost" 
          className={cn(
            "w-full justify-start px-3 py-2 text-gray-300 hover:bg-[#3A3A3A] hover:text-white",
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
