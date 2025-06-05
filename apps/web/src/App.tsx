import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { ChevronDown, Search,LogOut, User } from "lucide-react";
import Home from "./pages/Home";
import TacticsDetails from "./pages/TacticsDetails.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import { Login } from "./components/Login.tsx";
import { Menu as DropdownMenu, Transition } from '@headlessui/react';
import {handleLogout} from "./lib/supabase.ts";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route - Login */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected routes inside Layout */}
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/tactics/:id"
        element={
          <Layout>
            <TacticsDetails />
          </Layout>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


const Header: React.FC = () => {
    const { displayName } = useAuth();
    console.log(displayName);
    const nameParts = displayName.trim().split(' ');
    const initials =
        nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
            : nameParts[0][0].toUpperCase();

    return (
    <header className="  bg-[#1a1a1a] border border-[rgb(49,54,63)]">
      <div className="flex items-center h-16 px-6">
        {/* Logo - Far left */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[var(--primary)]">
            The Offside Trap
          </h1>
        </div>

        {/* Navigation - Center */}
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Home
            </a>
            <a
              href="/create"
              className="text-white hover:text-gray-200 transition-colors"
            >
              Create
            </a>
            <a
              href="/my-tactics"
              className="text-white hover:text-gray-200 transition-colors"
            >
              My Tactics
            </a>
            <div className="relative">
              <button className="flex items-center space-x-2 text-white hover:bg-gray-700 transition-colors px-4 py-2 rounded-full">
                <span className="text-sm font-medium">Categories</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </div>

        {/* Search and User - Far right */}
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block rounded-3xl text-white">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search tactics..."
              className="search-input w-64 rounded-3xl"
            />
          </div>

          {/* User avatar */}
            <div className="relative">
                <DropdownMenu as="div" className="relative">
                    <DropdownMenu.Button className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white text-sm font-bold hover:ring-2 hover:ring-green-400 focus:outline-none">
                        {initials}
                    </DropdownMenu.Button>

                    <Transition
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <DropdownMenu.Items className="absolute right-0 mt-3 w-40 bg-[#1a1a1a]  border border-[rgb(49,54,63)] text-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="py-1 text-sm">
                                <DropdownMenu.Item>
                                    {({ active }) => (
                                        <a
                                            href="/profile"
                                            className={`flex items-center px-4 py-2 rounded-md ${
                                                active ? 'bg-gray-700' : ''
                                            }`}
                                        >
                                            <User className="w-4 h-4 mr-2" />
                                            Profile
                                        </a>
                                    )}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={handleLogout}
                                            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
                                                active ? 'bg-gray-700' : ''
                                            }`}
                                        >
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Logout
                                        </button>
                                    )}
                                </DropdownMenu.Item>
                            </div>
                        </DropdownMenu.Items>
                    </Transition>
                </DropdownMenu>
            </div>
        </div>
      </div>
    </header>
  );
};

// Footer component
const Footer: React.FC = () => {
  return (
    <footer className="footer bg-black text-white">
      <div className="px-6">
        {/* Main footer content with better spacing */}
        <div className="flex items-center py-3">
          <div className="footer-brand">
            <h3 className="text-xl font-bold text-[var(--primary)] mb-2">
              The Offside Trap
            </h3>
            <p className="text-gray-400 text-base">
              The ultimate hub for football tactics
            </p>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="footer-links flex items-center space-x-5">
              <a
                href="/about"
                className="text-gray-300 hover:text-white transition-colors text-base font-medium"
              >
                About
              </a>
              <a
                href="/privacy"
                className="text-gray-300 hover:text-white transition-colors text-base font-medium"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="text-gray-300 hover:text-white transition-colors text-base font-medium"
              >
                Terms
              </a>
              <a
                href="/contact"
                className="text-gray-300 hover:text-white transition-colors text-base font-medium"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="w-[200px]"></div>
        </div>

        {/* Bottom section with better separation */}
        <div className="footer-bottom border-t border-gray-800 py-6">
          <p className="text-gray-400 text-center text-base">
            © 2025 The Offside Trap. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Header />
      <main className="py-8">{children}</main>
      <Footer />
    </div>
  );
};

export default App;
