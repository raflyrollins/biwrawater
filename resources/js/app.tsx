import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { createRoot } from 'react-dom/client';

import { ThemeProvider } from './hooks/useTheme';
import type { StoredTheme } from './hooks/useTheme';

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
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
            <ThemeProvider appearance={appearance ?? 'system'}>
                <App {...props} />
            </ThemeProvider>
        );

        if (!el) {
            return app;
        }

        createRoot(el).render(app);
    },
});
