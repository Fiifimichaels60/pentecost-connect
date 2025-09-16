import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import Groups from "./pages/Groups";
import Members from "./pages/Members";
import Attendance from "./pages/Attendance";
import Birthday from "./pages/Birthday";
import Templates from "./pages/Templates";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="church-sms-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
                  <div className="flex h-16 items-center px-4">
                    <SidebarTrigger className="mr-4" />
                    <div>
                      <h2 className="text-lg font-semibold">Church Of Pentecost</h2>
                      <p className="text-sm text-muted-foreground">Anaji English Assembly</p>
                    </div>
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
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
