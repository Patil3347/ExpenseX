
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-[#1A1A1A] text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 transition-all duration-300">
        <div className="animate-fade-in">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
