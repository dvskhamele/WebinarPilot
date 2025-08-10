import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/navbar";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import Blog from "@/pages/blog";
import WebinarDetail from "@/pages/webinar-detail";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

interface User {
  name: string;
  email: string;
}

function Router() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = () => {
    // Simple mock login - in real app this would be proper auth
    const email = prompt('Enter your email:');
    if (email) {
      const user = {
        name: email.split('@')[0],
        email: email
      };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/blog" component={Blog} />
          <Route path="/webinar/:id" component={WebinarDetail} />
          <Route path="/dashboard">
            {currentUser ? (
              <Dashboard currentUser={currentUser} />
            ) : (
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900">Please sign in to view your dashboard</h1>
                <button 
                  onClick={handleLogin}
                  className="mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Sign In
                </button>
              </div>
            )}
          </Route>
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <footer className="bg-gray-800 text-white mt-20">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 WebinarHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
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
