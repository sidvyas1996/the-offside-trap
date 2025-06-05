import React, { useState, useEffect } from "react";
import { TacticEntity } from "../entities/TacticEntity.ts";
import { AlertCircle, TrendingUp, Award, Clock } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "../lib";
import { TacticCard } from "../components/TacticCard";
import type {TabValue, TacticSummary} from "../../../../packages/shared";



const Home: React.FC = () => {
    const [tactics, setTactics] = useState<TacticSummary[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabValue>("trending");
    const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        // Check if there's a category filter in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get("category");
        if (category) {
            setFilteredCategory(category);
        }
    }, []);

    // Reload tactics when sorting, category, or search changes
    useEffect(() => {
        loadTactics();
    }, [activeTab, filteredCategory, searchQuery]);

    const loadTactics = async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            // Build query parameters
            const params: Record<string, string> = {
                sortBy: activeTab
            };

            if (filteredCategory) {
                params.category = filteredCategory;
            }

            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const data = await TacticEntity.list(params);
            setTactics(data);
        } catch (err) {
            setError("Failed to load tactics. Please try again later.");
            console.error(err);
            setTactics([]);
        } finally {
            setLoading(false);
        }
    };

    const renderTactics = (): React.ReactNode => {
        if (loading) {
            return (
                <div className="tactics-grid">
                    {[...Array(6)].map((_, i: number) => (
                        <div key={i} className="tactic-card">
                            <div className="aspect-video skeleton"></div>
                            <div className="p-4 space-y-4">
                                <div className="skeleton h-4 w-3/4"></div>
                                <div className="flex gap-2">
                                    <div className="skeleton h-6 w-16 rounded-full"></div>
                                    <div className="skeleton h-6 w-16 rounded-full"></div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="skeleton h-4 w-16"></div>
                                    <div className="skeleton h-4 w-20"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (tactics.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-[var(--text-secondary)] mb-4">
                        {searchQuery ? "No tactics match your search" : filteredCategory ? "No tactics found in this category" : "No tactics found"}
                    </p>
                    <Link to={createPageUrl("Create")}>
                        <button className="btn-primary">
                            Create your first tactic
                        </button>
                    </Link>
                </div>
            );
        }

        return (
            <div className="tactics-grid">
                {tactics.map((tactic: TacticSummary) => (
                    <TacticCard key={tactic.id} tactic={tactic} />
                ))}
            </div>
        );
    };

    const handleTabChange = (value: string): void => {
        setActiveTab(value as TabValue);
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
            {/* Hero section */}
            {!filteredCategory && (
                <div className="hero-section mb-12">
                    <div className="hero-content px-6 py-16 md:py-32 md:px-12">
                        <div className="max-w-2xl">
                            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                                Discover & Share Football Tactics
                            </h1>
                            <p className="text-lg md:text-xl text-gray-200 mb-8">
                                Create, analyze and discuss football formations and strategies with the community
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to={createPageUrl("Create")}>
                                    <button className="btn-primary">
                                        Create Tactics
                                    </button>
                                </Link>
                                <button className="btn-outline">
                                    Explore Tactics
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Page header with tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div className="page-header">
                    <h2>
                        {filteredCategory ? `${filteredCategory} Tactics` : 'All Tactics'}
                    </h2>
                    {searchQuery && (
                        <p>
                            Showing results for "{searchQuery}"
                        </p>
                    )}
                    {filteredCategory && (
                        <p>
                            Showing all tactics with the {filteredCategory} tag
                        </p>
                    )}
                </div>

                <Tabs
                    defaultValue="trending"
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="mt-4 md:mt-0"
                >
                    <TabsList className="tabs-list">
                        <TabsTrigger value="trending" className="tab-trigger flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Trending</span>
                        </TabsTrigger>
                        <TabsTrigger value="featured" className="tab-trigger flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            <span className="hidden sm:inline">Featured</span>
                        </TabsTrigger>
                        <TabsTrigger value="latest" className="tab-trigger flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">Latest</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Error alert */}
            {error && (
                <Alert variant="destructive" className="alert-destructive mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tactics grid */}
            {renderTactics()}
        </div>
    );
};

export default Home;