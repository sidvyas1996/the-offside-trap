// main.tsx or index.tsx - Entry point with proper CSS variables
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Make sure to define your CSS variables in your CSS file
const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);