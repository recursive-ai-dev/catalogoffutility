/**
 * BULLETPROOF Lazy Loading Components
 * Zero crashes, perfect error handling
 */

import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// BULLETPROOF: Lazy load components with comprehensive error handling
export const LazyPhotoAlbum = lazy(() => 
  import('./PhotoAlbum').then(module => {
    import('./HowToBook').catch(() => {}); // Preload silently
    return { default: module.default };
  }).catch(error => {
    console.error('PhotoAlbum load failed:', error);
    return { 
      default: () => (
        <div className="retro-panel h-full flex items-center justify-center">
          <div className="text-center retro-text">
            <div className="text-red-400 mb-2">PhotoAlbum Unavailable</div>
            <div className="text-sm">Component failed to load</div>
          </div>
        </div>
      )
    };
  })
);

export const LazyHowToBook = lazy(() => 
  import('./HowToBook').then(module => {
    import('./FuseBox').catch(() => {}); // Preload silently
    return { default: module.default };
  }).catch(error => {
    console.error('HowToBook load failed:', error);
    return { 
      default: () => (
        <div className="retro-panel h-full flex items-center justify-center">
          <div className="text-center retro-text">
            <div className="text-red-400 mb-2">Manual Unavailable</div>
            <div className="text-sm">Component failed to load</div>
          </div>
        </div>
      )
    };
  })
);

export const LazyFuseBox = lazy(() => 
  import('./FuseBox').then(module => {
    import('../services/saveSystemService').catch(() => {}); // Preload silently
    return { default: module.default };
  }).catch(error => {
    console.error('FuseBox load failed:', error);
    return { 
      default: () => (
        <div className="retro-panel h-full flex items-center justify-center">
          <div className="text-center retro-text">
            <div className="text-red-400 mb-2">Settings Unavailable</div>
            <div className="text-sm">Component failed to load</div>
          </div>
        </div>
      )
    };
  })
);

// BULLETPROOF: Loading fallback
const LoadingFallback: React.FC<{ name?: string }> = ({ name = 'Component' }) => (
  <div className="retro-panel h-full flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse retro-accent text-lg mb-2">
        Loading {name}...
      </div>
      <div className="text-xs retro-dim">
        Initializing systems...
      </div>
    </div>
  </div>
);

// BULLETPROOF: Error fallback with retry
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void; componentName?: string }> = ({ 
  error, 
  resetErrorBoundary,
  componentName = 'Component'
}) => (
  <div className="retro-panel h-full flex items-center justify-center">
    <div className="text-center max-w-md p-4">
      <div className="text-red-400 text-lg mb-2">
        {componentName} Error
      </div>
      <div className="text-xs retro-dim mb-4 break-words">
        {error.message}
      </div>
      <button
        onClick={resetErrorBoundary}
        className="retro-button px-4 py-2"
      >
        Retry
      </button>
    </div>
  </div>
);

// BULLETPROOF: Higher-order component wrapper
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  name: string
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary 
      FallbackComponent={(errorProps) => (
        <ErrorFallback {...errorProps} componentName={name} />
      )}
      onError={(error) => {
        console.error(`Error in ${name}:`, error);
      }}
    >
      <Suspense fallback={<LoadingFallback name={name} />}>
        <Component {...props} ref={ref} />
      </Suspense>
    </ErrorBoundary>
  ));
};

// BULLETPROOF: Preload with error handling
export const preloadComponent = (componentName: string) => {
  try {
    switch (componentName) {
      case 'PhotoAlbum':
        import('./PhotoAlbum').catch(() => {});
        break;
      case 'HowToBook':
        import('./HowToBook').catch(() => {});
        break;
      case 'FuseBox':
        import('./FuseBox').catch(() => {});
        break;
    }
  } catch (error) {
    // Silent fail for preloading
  }
};

// BULLETPROOF: Intelligent preloading hook
export const useIntelligentPreloading = () => {
  React.useEffect(() => {
    const preloadTimer = setTimeout(() => {
      try {
        preloadComponent('FuseBox');
        setTimeout(() => preloadComponent('HowToBook'), 1000);
        setTimeout(() => preloadComponent('PhotoAlbum'), 2000);
      } catch (error) {
        // Silent fail
      }
    }, 3000);

    return () => clearTimeout(preloadTimer);
  }, []);

  const handlePreloadHover = (componentName: string) => {
    try {
      preloadComponent(componentName);
    } catch (error) {
      // Silent fail
    }
  };

  return { handlePreloadHover };
};