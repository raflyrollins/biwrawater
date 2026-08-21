import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './hooks/useTheme';
import type { StoredTheme } from './hooks/useTheme';

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    host: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    port: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
    namespace: '',
});

createInertiaApp({
    serverHead: true,
    progress: {
        color: '#0094D9',
    },
    setup({ el, App, props }) {
        const appearance = props.initialPage.props.appearance as
            StoredTheme | undefined;

        const app = (
            <ErrorBoundary>
                <ThemeProvider appearance={appearance ?? 'system'}>
                    <ToastProvider>
                        <ConfirmProvider>
                            <App {...props} />
                        </ConfirmProvider>
                    </ToastProvider>
                </ThemeProvider>
            </ErrorBoundary>
        );

        if (!el) {
            return app;
        }

        createRoot(el).render(app);
    },
});
