export function splitDateTime(value: string): { date: string; time: string } {
    return {
        date: value ? value.slice(0, 10) : '',
        time: value ? value.slice(11, 16) : '',
    };
}

export function combineDateTime(date: string, time: string): string {
    return date && time ? `${date}T${time}` : '';
}

export function todayIso(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}
