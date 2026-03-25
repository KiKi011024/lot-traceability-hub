import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WarehouseProvider } from "@/context/WarehouseContext";
import AppSidebar from "@/components/AppSidebar";
import Warehouse3D from "@/pages/Warehouse3D";
import LotList from "@/pages/LotList";
import LotRegistration from "@/pages/LotRegistration";
import LotDetail from "@/pages/LotDetail";
import SearchPage from "@/pages/SearchPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <WarehouseProvider>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 ml-64 p-8">
              <Routes>
                <Route path="/" element={<Warehouse3D />} />
                <Route path="/lots" element={<LotList />} />
                <Route path="/lots/new" element={<LotRegistration />} />
                <Route path="/lots/:id" element={<LotDetail />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </WarehouseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
