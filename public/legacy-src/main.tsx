import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './services/localizationService'; // Initialize i18n
import { errorHandlingService } from './services/errorHandlingService'; // Initialize error handling
import { performanceOptimizer } from './services/performanceOptimizer'; // Initialize performance optimization
import { App } from './App.tsx';
import './index.css';

// Initialize performance optimizations immediately
performanceOptimizer.initialize();

// Initialize error handling service
errorHandlingService.onError((error) => {
  // In production, you might want to send errors to a logging service
  if (process.env.NODE_ENV === 'development') {
    console.error('Game Error:', error);
  }
});

// Performance mark for measuring initialization time
performance.mark('app-init-start');

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Mark initialization complete
performance.mark('app-init-end');
performance.measure('app-initialization', 'app-init-start', 'app-init-end');

// Log performance metrics
setTimeout(() => {
  const measure = performance.getEntriesByName('app-initialization')[0];
  console.log(`App initialization took: ${measure.duration.toFixed(2)}ms`);
}, 100);