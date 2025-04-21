
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, PrivateRoute } from "@/lib/auth";

// Layouts
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* App Routes (Protected) */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/expenses" element={
              <PrivateRoute>
                <MainLayout>
                  <Expenses />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/categories" element={
              <PrivateRoute>
                <MainLayout>
                  <Categories />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/reports" element={
              <PrivateRoute>
                <MainLayout>
                  <Reports />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </PrivateRoute>
            } />
            
            {/* Redirect from root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
