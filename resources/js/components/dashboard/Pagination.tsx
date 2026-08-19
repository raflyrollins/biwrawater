import { Link } from '@inertiajs/react';

import { cn } from '../../lib/utils';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
}

export default function Pagination({ links }: PaginationProps) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav
            aria-label="Paginasi"
            className="mt-8 flex flex-wrap items-center gap-2"
        >
            {links.map((link, index) => {
                const label = link.label.replace(/&laquo;|&raquo;/g, '').trim();

                if (!link.url) {
                    return (
                        <span
                            key={index}
                            className="cursor-not-allowed border border-border-default px-3 py-2 text-sm text-fg-disabled"
                        >
                            {label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        className={cn(
                            'border border-border-default px-3 py-2 text-sm no-underline transition-colors hover:bg-neutral-tertiary-soft',
                            link.active &&
                                'bg-brand text-on-brand hover:bg-brand',
                        )}
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
