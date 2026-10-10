import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './', // CRITICAL for electron production build local file URLs
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      hmr: true,
      // Vite rejects unknown Host headers by default, which breaks tunneled
      // previews. Allow the Arena sandbox proxy plus anything the operator
      // lists in VITE_ALLOWED_HOSTS (comma-separated).
      allowedHosts: [
        '.e2b.app',
        ...(process.env.VITE_ALLOWED_HOSTS ?? '').split(',').filter(Boolean),
      ],
    },
    build: {
      // Split the two heavy third-party roots out of the application chunk so an
      // edit in src/ does not invalidate the vendor cache.
      //
      // Function form, not the object shorthand: the object form maps only the
      // listed module ids, which left react-dom and scheduler behind in the app
      // chunk and made the "react" chunk a near-empty stub.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react';
            }
            if (id.includes('@supabase')) return 'supabase';
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    },
  };
});
