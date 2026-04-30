import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Handle Chrome/Android install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 30 seconds as per instructions
      setTimeout(() => setIsVisible(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also listen for our custom event
    const handleCustomInstallable = () => setIsVisible(true);
    window.addEventListener('pwa-installable', handleCustomInstallable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handleCustomInstallable);
    };
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
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && !localStorage.getItem('pwa-install-dismissed') && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-5 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
        >
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="App Icon" className="w-8 h-8 rounded-lg" />
              <div className='flex flex-col'>
                <h3 className="text-sm font-bold text-white">Animedia</h3>
                <span className="text-[10px] text-white/50 tracking-widest uppercase">Add to Home Screen</span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
                <button onClick={dismissPrompt} className="p-1 hover:bg-white/5 rounded-full text-white/40">
                  <X size={16} />
                </button>
                <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                    Install
                </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
