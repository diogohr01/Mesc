import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/UI/ErrorBoundary';

const root = document.getElementById('root');
const reactRoot = createRoot(root);

reactRoot.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);