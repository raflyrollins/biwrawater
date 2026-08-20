declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                options?: {
                    onSuccess?: (result: unknown) => void;
                    onPending?: (result: unknown) => void;
                    onError?: (result: unknown) => void;
                    onClose?: () => void;
                },
            ) => void;
        };
    }
}

let snapScript: HTMLScriptElement | null = null;
let snapLoad: Promise<void> | null = null;

export function loadMidtransScript(
    src: string,
    clientKey: string,
): Promise<void> {
    if (snapLoad) {
        return snapLoad;
    }

    snapLoad = new Promise((resolve, reject) => {
        snapScript = document.createElement('script');
        snapScript.src = src;
        snapScript.setAttribute('data-client-key', clientKey);
        snapScript.onload = () => resolve();
        snapScript.onerror = () => {
            snapScript = null;
            snapLoad = null;
            reject(new Error('Gagal memuat popup pembayaran Midtrans.'));
        };
        document.body.appendChild(snapScript);
    });

    return snapLoad;
}

export function openSnapPayment(options: {
    token: string;
    clientKey: string;
    script: string;
    onSuccess: (result: unknown) => void;
    onPending: (result: unknown) => void;
    onClose: () => void;
}): void {
    loadMidtransScript(options.script, options.clientKey)
        .then(() => {
            window.snap?.pay(options.token, {
                onSuccess: options.onSuccess,
                onPending: options.onPending,
                onError: options.onClose,
                onClose: options.onClose,
            });
        })
        .catch(() => {
            options.onClose();
        });
}
