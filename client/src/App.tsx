import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing-page";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import FormBuilder from "@/pages/form-builder";
import PublicForm from "@/pages/public-form";
import TemplatesPage from "@/pages/templates";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // or a splash screen
  }

  // If user is authenticated, show authenticated routes
  if (user) {
    return (
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
        <Route component={NotFound} />
      </Switch>
    );
  }

  // If user is not authenticated, show public routes
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/forms/:id" component={PublicForm} />
      <Route component={LandingPage} />
    </Switch>
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
