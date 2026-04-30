import { ShieldAlert, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";

const ANIMATION_INTENSITIES = [
  { id: 'simple', name: 'Simple' },
  { id: 'balanced', name: 'Balanced' },
  { id: 'luxurious', name: 'Luxurious' },
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
      <div>
        <h1 className="text-4xl font-serif font-light text-white tracking-wide">Settings</h1>
        <p className="text-white/50 mt-2">Customize your premium streaming experience.</p>
      </div>

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
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-black absolute transition-all duration-300",
                    settings.captionsEnabled ? "translate-x-7" : "translate-x-1"
                  )} />
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
            <div className="bg-[#111] border border-white/5 p-6 flex flex-col gap-4 rounded-2xl">
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={`#${settings.accentColor.replace('#', '')}`}
                  onChange={(e) => updateSettings({ accentColor: e.target.value.replace('#', '') })}
                  className="w-16 h-16 rounded-2xl cursor-pointer border-none bg-transparent"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-white/50">Hex Color</span>
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
