// Updated App.tsx with Code Splitting
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Import SignIn normally (needed immediately for auth)
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";

// Lazy load pages that aren't immediately needed
const Index = lazy(() => import("./pages/Index"));
const Monthly = lazy(() => import("./pages/Monthly"));
const Manager = lazy(() => import("./pages/Manager"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading skeleton component
const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="animate-pulse">
      {/* Navigation skeleton */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="h-8 bg-gray-300 rounded w-32"></div>
          <div className="flex space-x-4">
            <div className="h-8 bg-gray-300 rounded w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-96"></div>
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg border">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-20 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* SignIn loads immediately - needed for auth */}
          <Route path="/signin" element={<SignIn />} />
          
          {/* All other pages load on-demand with suspense */}
          <Route 
            path="/" 
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Index />
              </Suspense>
            } 
          />
          <Route 
            path="/monthly" 
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Monthly />
              </Suspense>
            } 
          />
          <Route 
            path="/manager" 
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Manager />
              </Suspense>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Profile />
              </Suspense>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Settings />
              </Suspense>
            } 
          />
          
          {/* 404 page loads immediately */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;