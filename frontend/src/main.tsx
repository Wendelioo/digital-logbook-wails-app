import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'

// Extend Window interface to include Wails runtime
declare global {
  interface Window {
    go?: {
      main?: {
        App?: any;
      };
    };
  }
}

const container = document.getElementById('root')
const root = createRoot(container!)

// Function to check if Wails runtime is ready
function isWailsReady(): boolean {
    return typeof window !== 'undefined' && 
           window.go !== undefined && 
           window.go.main !== undefined;
}

// Wait for Wails runtime to be ready before rendering
function renderApp() {
    if (isWailsReady()) {
        root.render(
            <React.StrictMode>
                <App/>
            </React.StrictMode>
        )
    } else {
        // Retry after a short delay
        setTimeout(renderApp, 50);
    }
}

// Start the render process
renderApp();
