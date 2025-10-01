import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import Groups from "./pages/Groups";
import Members from "./pages/Members";
import Attendance from "./pages/Attendance";
import Birthday from "./pages/Birthday";
import Templates from "./pages/Templates";
import History from "./pages/History";
import Settings from "./pages/Settings";
import AdminManagement from "./pages/AdminManagement";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Main app layout for authenticated users
const MainLayout = () => {
  const { signOut } = useAuth();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center">
                <SidebarTrigger className="mr-4" />
                <div>
                  <h2 className="text-lg font-semibold">Church Of Pentecost</h2>
                  <p className="text-sm text-muted-foreground">Anaji English Assembly</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/members" element={<Members />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/birthday" element={<Birthday />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/history" element={<History />} />
              <Route path="/admin-management" element={<AdminManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="church-sms-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
