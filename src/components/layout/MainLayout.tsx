
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
}
