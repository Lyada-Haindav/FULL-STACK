import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { useAuth } from "@/hooks/use-auth";

const LandingPage = lazy(() => import("@/pages/landing-page"));
const LoginPage = lazy(() => import("@/pages/login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const FormBuilder = lazy(() => import("@/pages/form-builder"));
const PublicForm = lazy(() => import("@/pages/public-form"));
const TemplatesPage = lazy(() => import("@/pages/templates"));
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const isPublicForm = location.startsWith("/forms/");

  // If user is authenticated, show authenticated routes
  if (user && !isLoading) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Switch>
          <Route path="/login">
            {/* Redirect authenticated users from login to dashboard */}
            <Dashboard />
          </Route>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/dashboard/new" component={Dashboard} />
          <Route path="/templates" component={TemplatesPage} />
          <Route path="/builder/:id" component={FormBuilder} />
          <Route path="/forms/:id" component={PublicForm} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  }

  // If user is not authenticated, show public routes
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/forms/:id" component={PublicForm} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route component={LandingPage} />
      </Switch>
      {isLoading && !isPublicForm ? (
        <div className="pointer-events-none fixed inset-0 bg-background/40" />
      ) : null}
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
