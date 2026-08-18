interface FieldErrorProps {
    message?: string;
}

export default function FieldError({ message }: FieldErrorProps) {
    return (
        <div className="mt-1.5 min-h-[1.25rem]" aria-live="polite">
            {message && (
                <p className="text-sm leading-5 text-danger-strong">
                    {message}
                </p>
            )}
        </div>
    );
}
