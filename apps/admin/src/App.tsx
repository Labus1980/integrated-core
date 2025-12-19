import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import LemBrand from "./pages/LemBrand";
import OdooPhoneWidget from "./pages/OdooPhoneWidget";
import FloatingWidgetPage from "./pages/FloatingWidgetPage";
import Bank from "./pages/Bank";
import NotFound from "./pages/NotFound";
import ZammadFormInit from "@/components/ZammadFormInit";
import { useZammadChat } from "@/hooks/useZammadChat";

const queryClient = new QueryClient();

// Отдельный компонент для страницы floating-widget без темы
const FloatingWidgetApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/floating-widget" element={<FloatingWidgetPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Основное приложение с темой
const MainApp = () => {
  useZammadChat(); // Инициализация чата

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/lembrand" element={<LemBrand />} />
              <Route path="/phone-widget" element={<OdooPhoneWidget />} />
              <Route path="/bank" element={<Bank />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {/* Инициализация формы обратной связи (скрытая кнопка для программного клика) */}
          <ZammadFormInit />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Выбор приложения в зависимости от пути
const App = () => {
  // Для /floating-widget рендерим без ThemeProvider
  if (window.location.pathname === '/floating-widget') {
    return <FloatingWidgetApp />;
  }
  return <MainApp />;
};

export default App;
