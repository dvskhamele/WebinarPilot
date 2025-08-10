import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

interface NavbarProps {
  currentUser?: { name: string; email: string } | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function Navbar({ currentUser, onLogin, onLogout }: NavbarProps) {
  const [location] = useLocation();

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" data-testid="link-home" className="flex items-center space-x-2">
            <svg className="h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3m-16.5 0h16.5m-16.5 0H3.75m16.5 0H20.25m0 0V3.75m0 10.5V14.25m0 0A2.25 2.25 0 0018 12h-1.5a2.25 2.25 0 00-2.25 2.25V15m0 0h-1.5a2.25 2.25 0 01-2.25-2.25V12a2.25 2.25 0 012.25-2.25h1.5A2.25 2.25 0 0118 12v3m-3.75 0h-1.5a2.25 2.25 0 00-2.25 2.25V15m0 0h1.5m-1.5 0a2.25 2.25 0 012.25-2.25v-1.5a2.25 2.25 0 01-2.25-2.25H9.75m0 10.5h1.5m-1.5 0a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h1.5m-1.5 0h-1.5a2.25 2.25 0 01-2.25-2.25V18a2.25 2.25 0 012.25-2.25h1.5m6 0h1.5m-1.5 0a2.25 2.25 0 002.25 2.25v1.5a2.25 2.25 0 00-2.25 2.25h-1.5m1.5 0h-1.5a2.25 2.25 0 01-2.25-2.25V18a2.25 2.25 0 012.25-2.25h1.5" />
            </svg>
            <span className="text-xl font-bold text-gray-900">WebinarHub</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link 
              href="/"
              className={`text-sm font-medium ${location === '/' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >Home</Link>
            <Link 
              href="/explore"
              className={`text-sm font-medium ${location === '/explore' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >Explore</Link>
            <Link 
              href="/blog"
              className={`text-sm font-medium ${location === '/blog' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}
            >Blog</Link>
            {currentUser ? (
              <>
                <Link 
                  href="/dashboard" 
                  data-testid="link-dashboard"
                  className="text-sm font-semibold text-gray-600 hover:text-indigo-600"
                >
                  My Hub
                </Link>
                <span className="text-sm text-gray-600" data-testid="text-username">
                  {currentUser.name}
                </span>
                <Button 
                  variant="outline" 
                  onClick={onLogout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/signin"
                  data-testid="button-signin"
                  className="text-sm font-semibold text-gray-600 hover:text-indigo-600"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  data-testid="button-signup"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
