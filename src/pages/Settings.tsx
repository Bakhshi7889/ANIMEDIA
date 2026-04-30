import { ShieldAlert, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";
import { motion } from "framer-motion";

const ANIMATION_INTENSITIES = [
  { id: 'simple', name: 'Simple' },
  { id: 'balanced', name: 'Balanced' },
  { id: 'luxurious', name: 'Luxurious' },
];

const COLORS = [
  { id: 'facc15', name: 'Classic Yellow', hex: '#facc15' },
  { id: 'ffffff', name: 'Classic White', hex: '#ffffff' },
  { id: '0dcaf0', name: 'Ocean Blue', hex: '#0dcaf0' },
  { id: 'e50914', name: 'Cinema Red', hex: '#e50914' },
  { id: '9146ff', name: 'Neon Purple', hex: '#9146ff' },
  { id: '1DB954', name: 'Emerald', hex: '#1DB954' },
  { id: 'FF6321', name: 'Vibrant Orange', hex: '#FF6321' }
];

const CAPTION_LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'jp', name: 'Japanese' },
];

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  
  return (
    <div className="px-6 flex flex-col gap-12 max-w-4xl mx-auto pb-24 border-none outline-none">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-serif font-light text-white tracking-wide">Settings</h1>
        <p className="text-white/50 mt-2">Customize your premium streaming experience.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left Column */}
        <div className="flex flex-col gap-10">
          
          {/* Captions */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">Soft Subtitles & Captions</h2>
              <p className="text-sm text-white/50">Configure default caption behaviors directly injected into supported players.</p>
            </div>
            <div className="bg-[#111] border border-white/5 p-5 flex flex-col gap-5 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">Show Captions by Default</span>
                <button 
                  onClick={() => updateSettings({ captionsEnabled: !settings.captionsEnabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative flex items-center",
                    settings.captionsEnabled ? "bg-white" : "bg-white/20"
                  )}
                >
                  <motion.div 
                    animate={{ x: settings.captionsEnabled ? 28 : 4 }}
                    className="w-4 h-4 rounded-full bg-black transition-all"
                  />
                </button>
              </div>

              {settings.captionsEnabled && (
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <span className="text-xs text-white/50 uppercase tracking-widest font-medium">Default Language</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CAPTION_LANGUAGES.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => updateSettings({ captionLang: lang.id })}
                        className={cn(
                          "px-4 py-2 border text-sm font-medium transition-all rounded-xl",
                          settings.captionLang === lang.id ? "bg-white text-black border-white" : "bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white"
                        )}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Animations */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">Animations</h2>
              <p className="text-sm text-white/50">Adjust the intensity and style of UI motion.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ANIMATION_INTENSITIES.map(ani => (
                <button
                  key={ani.id}
                  onClick={() => updateSettings({ animations: ani.id as any })}
                  className={cn(
                    "px-4 py-2 border text-sm font-medium transition-all rounded-xl",
                    settings.animations === ani.id ? "bg-white text-black border-white" : "bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white"
                  )}
                >
                  {ani.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-10">
          
          {/* Color Settings */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">Player Accent Color</h2>
              <p className="text-sm text-white/50">Overrides the media player timeline and controls.</p>
            </div>
            <div className="bg-[#111] border border-white/5 p-6 flex flex-col gap-6 rounded-2xl">
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => updateSettings({ accentColor: c.id })}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all flex items-center justify-center relative overflow-hidden group",
                      settings.accentColor === c.id ? "ring-2 ring-white scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                     {settings.accentColor === c.id && (
                       <motion.div 
                        layoutId="activeColor"
                        className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center'
                       >
                         <div className="w-2 h-2 rounded-full bg-black shadow-sm" />
                       </motion.div>
                     )}
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <input 
                    type="color" 
                    value={`#${settings.accentColor.replace('#', '')}`}
                    onChange={(e) => updateSettings({ accentColor: e.target.value.replace('#', '') })}
                    className="absolute inset-0 w-full h-full rounded-full cursor-pointer border-none bg-transparent appearance-none"
                  />
                  <div 
                    className="w-12 h-12 rounded-full border border-white/20 pointer-events-none" 
                    style={{ backgroundColor: `#${settings.accentColor}` }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/50">Custom Hex</span>
                  <span className="text-lg font-mono text-white">#{settings.accentColor}</span>
                </div>
              </div>
            </div>
          </section>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500 mt-4">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-xs leading-relaxed">
              <strong>Note:</strong> Third party servers have varying support for deep customization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
