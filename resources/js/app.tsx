import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';

configureEcho({
    broadcaster: 'reverb',
});

createInertiaApp({
    serverHead: true,
    progress: {
        color: '#0094D9',
    },
});
