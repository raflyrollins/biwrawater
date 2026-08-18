import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
    const { dark, toggle } = useTheme();

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={dark ? 'Mode terang' : 'Mode gelap'}
            className="inline-flex size-11 items-center justify-center text-body-subtle transition-colors duration-150 hover:bg-neutral-tertiary-soft hover:text-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
            {dark ? (
                <Sun size={20} aria-hidden="true" />
            ) : (
                <Moon size={20} aria-hidden="true" />
            )}
        </button>
    );
}
