import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

const THEME_COOKIE = 'appearance';

export type StoredTheme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
    dark: boolean;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeToSystemTheme(onChange: () => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
}

function getSystemTheme(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
}

function getSystemThemeForServer(): boolean {
    return false;
}

function writeCookie(theme: 'light' | 'dark'): void {
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({
    appearance,
    children,
}: {
    appearance: StoredTheme;
    children: ReactNode;
}) {
    const [stored, setStored] = useState<StoredTheme>(appearance);
    const systemDark = useSyncExternalStore(
        subscribeToSystemTheme,
        getSystemTheme,
        getSystemThemeForServer,
    );
    const dark = stored === 'system' ? systemDark : stored === 'dark';

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const root = document.documentElement;

        root.classList.toggle('dark', dark);
        root.classList.toggle('light', !dark);
    }, [dark]);

    const toggle = useCallback(() => {
        const next = !dark;

        setStored(next ? 'dark' : 'light');
        writeCookie(next ? 'dark' : 'light');
    }, [dark]);

    const value = useMemo(() => ({ dark, toggle }), [dark, toggle]);

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const value = useContext(ThemeContext);

    if (value === null) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return value;
}
