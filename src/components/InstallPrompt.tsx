import React, { useState, useEffect } from 'react';
import { X, Share, ChevronUp, PlusSquare, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Handle Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, check if we should show the manual prompt
    if (isIOSDevice && !localStorage.getItem('ios-pwa-prompt-dismissed')) {
      setIsVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    if (isIOS) {
      localStorage.setItem('ios-pwa-prompt-dismissed', 'true');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install Animedia</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">Faster & Offline</p>
                </div>
              </div>
              <button onClick={dismissPrompt} className="p-1 hover:bg-white/5 rounded-full text-white/40">
                <X size={16} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3">
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Install this app on your iPhone for a native experience.
                </p>
                <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white"><Share size={12} /></span>
                    1. Tap the Share button below
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/60">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white"><PlusSquare size={12} /></span>
                    2. Select 'Add to Home Screen'
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <ChevronUp className="text-blue-500 animate-bounce" size={20} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Get the best experience with our desktop and mobile app.
                </p>
                <button
                  onClick={handleInstall}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  Install Now
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
