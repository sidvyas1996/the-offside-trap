// lib/index.ts - Utility functions
// Function to create page URLs for navigation
export const createPageUrl = (page: string): string => {
    // Convert page names to routes
    const pageToRoute: Record<string, string> = {
        'Home': '/',
        'Create': '/create',
        'Detail': '/detail',
        'MyTactics': '/my-tactics',
        'My Tactics': '/my-tactics',
    };

    // Handle Detail page with query parameters
    if (page.startsWith('Detail?')) {
        const queryParams = page.split('?')[1];
        return `/detail?${queryParams}`;
    }

    return pageToRoute[page] || `/${page.toLowerCase()}`;
};

// Alternative implementation that preserves query parameters
export const createPageUrlWithQuery = (page: string, queryParams?: Record<string, string>): string => {
    const baseUrl = createPageUrl(page);

    if (queryParams && Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams(queryParams);
        return `${baseUrl}?${searchParams.toString()}`;
    }

    return baseUrl;
};