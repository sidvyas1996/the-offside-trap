// App.tsx - Simplified with only Home and CreateTactics
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Home from './pages/Home';
import CreateTactics from './pages/CreateTactics';

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-[var(--primary)]">
                            The Offside Trap
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        <a href="/" className="nav-link">
                            Home
                        </a>
                        <a href="/create" className="nav-link">
                            Create
                        </a>
                        <div className="flex items-center space-x-4 ml-6">
                            <span className="text-sm text-[var(--text-secondary)]">Categories</span>
                            <span className="text-[var(--text-secondary)]">⌄</span>
                        </div>
                    </nav>

                    {/* Search and User */}
                    <div className="flex items-center space-x-4">
                        <div className="relative hidden md:block">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]">
                                <Search className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tactics..."
                                className="search-input w-64"
                            />
                        </div>

                        {/* User avatar */}
                        <div className="user-avatar">
                            SV
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

// Footer component
const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-main">
                    <div className="footer-brand">
                        <h3>The Offside Trap</h3>
                        <p>The ultimate hub for football tactics</p>
                    </div>
                    <div className="footer-links">
                        <a href="/about">About</a>
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                        <a href="/contact">Contact</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2023 The Offside Trap. All rights reserved.</p>
                    <span className="terminal-badge">Terminal</span>
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
                    <Route path="/create" element={<CreateTactics />} />
                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;