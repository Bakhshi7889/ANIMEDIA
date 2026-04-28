import { useState, useEffect } from "react";
import { Check, ShieldAlert, Clock, Film } from "lucide-react";
import { cn } from "../lib/utils";

const COLORS = [
  { id: 'ffffff', name: 'Classic White', hex: '#ffffff' },
  { id: '0dcaf0', name: 'Ocean Blue', hex: '#0dcaf0' },
  { id: 'e50914', name: 'Cinema Red', hex: '#e50914' },
  { id: '9146ff', name: 'Neon Purple', hex: '#9146ff' },
  { id: '1DB954', name: 'Emerald', hex: '#1DB954' },
  { id: 'FF6321', name: 'Vibrant Orange', hex: '#FF6321' }
];

const BUTTON_STYLES = [
  { id: 'roundy', name: 'Round & Soft (App Style)', radius: 'rounded-full' },
  { id: 'smooth', name: 'Smooth (Modern)', radius: 'rounded-2xl' },
  { id: 'sharp', name: 'Sharp (Minimalist)', radius: 'rounded-md' }
];

const CAPTION_LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
  { id: 'de', name: 'German' },
  { id: 'jp', name: 'Japanese' },
];

export default function Settings() {
  const [accentColor, setAccentColor] = useState(localStorage.getItem('animedia_color') || 'ffffff');
  const [uiStyle, setUiStyle] = useState(localStorage.getItem('animedia_ui_style') || 'roundy');
  
  const [captionsEnabled, setCaptionsEnabled] = useState(localStorage.getItem('animedia_captions_enabled') !== 'false');
  const [captionLang, setCaptionLang] = useState(localStorage.getItem('animedia_captions_lang') || 'en');

  const [localHistoryCount, setLocalHistoryCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('animedia_color', accentColor);
    localStorage.setItem('animedia_ui_style', uiStyle);
    localStorage.setItem('animedia_captions_enabled', captionsEnabled.toString());
    localStorage.setItem('animedia_captions_lang', captionLang);
    window.dispatchEvent(new Event('settings_updated'));
  }, [accentColor, uiStyle, captionsEnabled, captionLang]);

  useEffect(() => {
    // Count local history and downloads (via our storage mechanism, typically saved to indexedDB not localstorage but we can fetch it)
    const fetchHistory = async () => {
       try {
          const { getRecentlyWatched } = await import('../lib/storage');
          const history = await getRecentlyWatched(100);
          setLocalHistoryCount(history.length);
       } catch(e) {}
    };
    fetchHistory();
  }, []);

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
            <div className={cn(
              "bg-[#111] border border-white/5 p-5 flex flex-col gap-5",
               uiStyle === 'roundy' ? 'rounded-3xl' : uiStyle === 'smooth' ? 'rounded-2xl' : 'rounded-lg'
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">Show Captions by Default</span>
                <button 
                  onClick={() => setCaptionsEnabled(!captionsEnabled)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative flex items-center",
                    captionsEnabled ? "bg-white" : "bg-white/20"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-black absolute transition-all duration-300",
                    captionsEnabled ? "translate-x-7" : "translate-x-1"
                  )} />
                </button>
              </div>

              {captionsEnabled && (
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <span className="text-xs text-white/50 uppercase tracking-widest font-medium">Default Language</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CAPTION_LANGUAGES.map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => setCaptionLang(lang.id)}
                        className={cn(
                          "px-4 py-2 border text-sm font-medium transition-all",
                          uiStyle === 'roundy' ? 'rounded-full' : uiStyle === 'smooth' ? 'rounded-xl' : 'rounded-md',
                          captionLang === lang.id ? "bg-white text-black border-white" : "bg-transparent text-white/60 border-white/20 hover:border-white/50 hover:text-white"
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
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-10">
          
          {/* Aesthetic Settings */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">App UI Architecture</h2>
              <p className="text-sm text-white/50">Change how buttons and panels physically look.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {BUTTON_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setUiStyle(style.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 border transition-all gap-3 bg-[#111]",
                    style.radius,
                    uiStyle === style.id ? "border-white/40 ring-1 ring-white/40 bg-white/5" : "border-white/5 hover:border-white/20 hover:bg-white/5 text-white/60"
                  )}
                >
                  <div className={cn("w-16 h-4 bg-white/20", style.radius)} />
                  <span className={cn("text-sm font-medium", uiStyle === style.id ? "text-white" : "")}>{style.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Color Settings */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-medium text-white">Player Accent Color</h2>
              <p className="text-sm text-white/50">Overrides the media player timeline and controls.</p>
            </div>
            <div className={cn(
              "bg-[#111] border border-white/5 p-6 flex flex-col gap-4",
               uiStyle === 'roundy' ? 'rounded-3xl' : uiStyle === 'smooth' ? 'rounded-2xl' : 'rounded-lg'
            )}>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all flex items-center justify-center",
                      accentColor === c.id ? "ring-2 ring-white ring-offset-4 ring-offset-[#111] scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {accentColor === c.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-white/50">Custom Hex: #</span>
                <input 
                  type="text" 
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                  className={cn(
                    "bg-black border border-white/20 px-4 py-2 w-28 text-sm font-mono text-white focus:outline-none focus:border-white/50",
                    uiStyle === 'roundy' ? 'rounded-full' : uiStyle === 'smooth' ? 'rounded-xl' : 'rounded-md'
                  )}
                  placeholder="ffffff"
                />
              </div>
            </div>
          </section>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500 mt-4">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p className="text-xs leading-relaxed">
              <strong>Note:</strong> Third party servers have varying support for deep customization. Accent colors and specific subtitles defaults are optimized for the Vidking player node.
            </p>
          </div>

        </div>
        
      </div>
    </div>
  );
}
