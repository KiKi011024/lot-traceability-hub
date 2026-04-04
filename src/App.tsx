import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WarehouseProvider } from "@/context/WarehouseContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AppSidebar from "@/components/AppSidebar";
import Warehouse3D from "@/pages/Warehouse3D";
import LotList from "@/pages/LotList";
import LotRegistration from "@/pages/LotRegistration";
import LotDetail from "@/pages/LotDetail";
import Withdrawals from "@/pages/Withdrawals";
import SearchPage from "@/pages/SearchPage";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={
            <AuthGuard>
              <WarehouseProvider>
                <div className="flex min-h-screen">
                  <AppSidebar />
                  <main className="flex-1 ml-64 p-8">
                    <Routes>
                      <Route path="/" element={<Warehouse3D />} />
                      <Route path="/lots" element={<LotList />} />
                      <Route path="/lots/new" element={<LotRegistration />} />
                      <Route path="/lots/:id" element={<LotDetail />} />
                      <Route path="/withdrawals" element={<Withdrawals />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </WarehouseProvider>
            </AuthGuard>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
