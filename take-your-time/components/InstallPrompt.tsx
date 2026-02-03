
import React, { useEffect, useState } from 'react';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        // Check if already in standalone mode
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        // Chrome/Android/Desktop: Listen for prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS fallback: Just show it once if not installed
        if (isIosDevice && !isStandalone) {
             // Simple logic: Show it if we are on iOS and not standalone
             // In a real app we might check a cookie to not annoy the user
             setIsVisible(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    if (!isVisible) return null;

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsVisible(false);
            }
        } else if (isIOS) {
            // We can't auto-trigger on iOS, just close the modal so they can see the instructions
            // In a fuller implementation, you might point an arrow to the share button
            alert("Tap the Share button below and select 'Add to Home Screen' to install.");
            setIsVisible(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-4">
            <div className="bg-[#1C1C1E] border border-white/10 p-5 rounded-3xl shadow-2xl pointer-events-auto w-full max-w-sm animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] flex items-center gap-4">
                <div className="size-14 bg-background-dark rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                    <img src="/icon.svg" alt="App Icon" className="w-10 h-10" />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-bold text-base leading-tight">Install App</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Use as a native app for the best experience.</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                    <button 
                        onClick={handleInstallClick}
                        className="bg-primary text-background-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        {isIOS ? 'How?' : 'Install'}
                    </button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="text-white/30 text-[10px] font-bold uppercase tracking-wider hover:text-white"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
