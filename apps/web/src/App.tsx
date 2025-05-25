// App.tsx - Simplified with only Home and CreateTactics
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import Home from './pages/Home';
import TacticsDetails from './pages/TacticsDetails.tsx';


    const Header: React.FC = () => {
        return (
            <header className="  bg-gray-950 border-gray-200 rounded-xl text-white">
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
        <a href="/" className="text-white hover:text-gray-200 transition-colors">
            Home
        </a>
        <a href="/create" className="text-white hover:text-gray-200 transition-colors">
            Create
        </a>
        <a href="/my-tactics" className="text-white hover:text-gray-200 transition-colors">
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
                        <div className="user-avatar">
                            SV
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
                        <h3 className="text-xl font-bold text-[var(--primary)] mb-2">The Offside Trap</h3>
                        <p className="text-gray-400 text-base">The ultimate hub for football tactics</p>
                    </div>
                    
                    <div className="flex-1 flex justify-center">
                        <div className="footer-links flex items-center space-x-5">
                            <a href="/about" className="text-gray-300 hover:text-white transition-colors text-base font-medium">About</a>
                            <a href="/privacy" className="text-gray-300 hover:text-white transition-colors text-base font-medium">Privacy</a>
                            <a href="/terms" className="text-gray-300 hover:text-white transition-colors text-base font-medium">Terms</a>
                            <a href="/contact" className="text-gray-300 hover:text-white transition-colors text-base font-medium">Contact</a>
                        </div>
                    </div>
                    
                    <div className="w-[200px]"></div>
                </div>
                
                {/* Bottom section with better separation */}
                <div className="footer-bottom border-t border-gray-800 py-6">
                    <p className="text-gray-400 text-center text-base">© 2025 The Offside Trap. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
            <Header />
            <main className="py-8">{children}</main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/tactics/:id" element={<TacticsDetails />} />

                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;