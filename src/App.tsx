
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, PrivateRoute } from "@/lib/auth";

// Layouts
import { MainLayout } from "@/components/layout/MainLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import Features from "@/pages/Features";
import Articles from "@/pages/Articles";
import About from "@/pages/About";
import Profile from "@/pages/Profile";
import Expenses from "@/pages/Expenses";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import Groups from "@/pages/Groups";
import Group from "@/pages/Group";

// Add global scroll behavior
import './index.css';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/features" element={<Features />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/about" element={<About />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
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
            
            {/* Add Groups routes */}
            <Route path="/groups" element={
              <PrivateRoute>
                <MainLayout>
                  <Groups />
                </MainLayout>
              </PrivateRoute>
            } />
            <Route path="/groups/:groupId" element={
              <PrivateRoute>
                <MainLayout>
                  <Group />
                </MainLayout>
              </PrivateRoute>
            } />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
