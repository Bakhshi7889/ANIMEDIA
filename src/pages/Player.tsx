import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Maximize, X, Download, Ear, Film, Server } from "lucide-react";
import { saveProgress } from "../lib/storage";
import { getDetails, getTvSeasons, type TMDBMovie, getImageUrl } from "../services/tmdb";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import CachedImage from "../components/CachedImage";

const VideoPlayer: React.FC<{ src: string, className?: string, controls?: boolean, autoPlay?: boolean }> = ({ src, className, controls, autoPlay }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported() && src.includes(".m3u8")) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      video.src = src;
    }
  }, [src]);

  return <video ref={videoRef} className={className} controls={controls} autoPlay={autoPlay} />;
};


const PROVIDERS = [
  { id: 'vidking', name: 'Vidking (High Speed)', recommended: true }
];

const COLORS = [
  { id: 'ffffff', name: 'Classic White', hex: '#ffffff' },
  { id: '0dcaf0', name: 'Ocean Blue', hex: '#0dcaf0' },
  { id: 'e50914', name: 'Cinema Red', hex: '#e50914' },
  { id: '9146ff', name: 'Neon Purple', hex: '#9146ff' },
  { id: '1DB954', name: 'Emerald', hex: '#1DB954' },
  { id: 'FF6321', name: 'Vibrant Orange', hex: '#FF6321' }
];

const SERVER_PROVIDERS = [
  { id: 'vidsrc', name: 'VidSrc', dot: 'bg-green-500' },
  { id: 'vidking', name: 'Vidking', dot: 'bg-green-500' },
  { id: 'vidrock', name: 'VidRock', dot: 'bg-green-500' },
  { id: 'vidlink', name: 'VidLink', dot: 'bg-yellow-500' }
];

const VOICE_PROVIDERS = [
  { id: 'en-dub', name: 'English (Dubbed)' },
  { id: 'en-sub', name: 'Original (EN Sub)' },
  { id: 'es-dub', name: 'Spanish (Dubbed)' },
  { id: 'jp-dub', name: 'Japanese (Dubbed)' }
];

export default function Player() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const lastSaveTimeRef = React.useRef<number>(0);
  
  const searchParams = new URLSearchParams(location.search);
  const resume = searchParams.get("resume") || "0";
  const initSeason = parseInt(searchParams.get("season") || "1", 10);
  const initEpisode = parseInt(searchParams.get("episode") || "1", 10);
  
  const [details, setDetails] = useState<TMDBMovie | null>(location.state?.movieDetails || null);
  const [activeSeason, setActiveSeason] = useState(initSeason);
  const [activeEpisode, setActiveEpisode] = useState(initEpisode);
  const [episodes, setEpisodes] = useState<any[]>([]);

  const [accentColor] = useState(localStorage.getItem('animedia_color') || 'ffffff');
  const [voiceProvider, setVoiceProvider] = useState(localStorage.getItem('animedia_voice') || 'en-dub');
  const [captionsEnabled] = useState(localStorage.getItem('animedia_captions_enabled') !== 'false');
  const [captionLang] = useState(localStorage.getItem('animedia_captions_lang') || 'en');
  
  const [serverMode, setServerMode] = useState(localStorage.getItem('animedia_server') || 'vidking');
  const [currentProgress, setCurrentProgress] = useState(parseFloat(resume));
  
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(-1);
  const [downloadSize, setDownloadSize] = useState("");

  const startDownload = (quality: string) => {
    const size = quality.includes('1080p') ? Math.floor(Math.random() * 2000 + 1000) : Math.floor(Math.random() * 800 + 400);
    setDownloadSize(`${size} MB`);
    setDownloadProgress(0);
    
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 8 + 4;
      if (prog >= 100) {
        clearInterval(interval);
        setDownloadProgress(100);
        setTimeout(() => {
          setShowDownloadModal(false);
          setDownloadProgress(-1);
          const downloads = JSON.parse(localStorage.getItem('animedia_downloads') || "[]");
          const newItem = {
            id, type, season: activeSeason, episode: activeEpisode,
            title: details?.title || details?.name,
            poster: getImageUrl(details?.poster_path, 'w185'),
            quality,
            size: `${size} MB`,
            date: new Date().toISOString()
          };
          const filtered = downloads.filter((h: any) => !(h.id === id && h.season === activeSeason && h.episode === activeEpisode));
          localStorage.setItem('animedia_downloads', JSON.stringify([newItem, ...filtered]));
        }, 1500);
      } else {
        setDownloadProgress(prog);
      }
    }, 300);
  };
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!details && id) {
      getDetails(id, type as any).then(setDetails).catch(console.error);
    }
  }, [id, type, details]);

  useEffect(() => {
    if (type === 'tv' && id && details) {
      getTvSeasons(id, activeSeason).then(data => setEpisodes(data.episodes || [])).catch(console.error);
    }
  }, [type, id, details, activeSeason]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (err) {}
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        try {
          await playerContainerRef.current.requestFullscreen();
          if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
            await (window.screen.orientation as any).lock("landscape").catch(() => {});
          }
        } catch (err) {
          console.warn("Fullscreen request failed:", err);
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        if (window.screen && window.screen.orientation && (window.screen.orientation as any).unlock) {
          window.screen.orientation.unlock();
        }
      }
    }
  };

  const [isCheckingServers, setIsCheckingServers] = useState(true);

  useEffect(() => {
    setIsCheckingServers(true);
    const timer = setTimeout(() => {
      setIsCheckingServers(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [id, type, activeSeason, activeEpisode]);

  const getEmbedUrl = () => {
    const cleanAccent = accentColor.replace('#', '');
    
    if (serverMode === 'vidrock') {
      return type === 'movie'
        ? `https://vidrock.ru/movie/${id}?theme=${cleanAccent}`
        : `https://vidrock.ru/tv/${id}/${activeSeason}/${activeEpisode}?theme=${cleanAccent}`;
    }
    if (serverMode === 'vidlink') {
      return type === 'movie'
        ? `https://vidlink.pro/movie/${id}?primaryColor=${cleanAccent}&autoplay=false&startAt=${currentProgress}`
        : `https://vidlink.pro/tv/${id}/${activeSeason}/${activeEpisode}?primaryColor=${cleanAccent}&autoplay=false&startAt=${currentProgress}`;
    }

    if (serverMode === 'vidsrc') {
      return type === 'movie'
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${activeSeason}&episode=${activeEpisode}`;
    }

    return type === 'movie' 
      ? `https://vidking.net/embed/movie/${id}?color=${cleanAccent}&autoPlay=true&progress=${currentProgress}`
      : `https://vidking.net/embed/tv/${id}/${activeSeason}/${activeEpisode}?color=${cleanAccent}&autoPlay=true&nextEpisode=true&episodeSelector=false&progress=${activeEpisode === initEpisode ? currentProgress : 0}`;
  };

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      try {
        let payload = event.data;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (e) { return; }
        }

        if (payload?.type === "PLAYER_EVENT" && payload.data) {
          const { event: pEvent, currentTime, duration, progress, timestamp } = payload.data;
          
          if (type === 'tv' && pEvent === 'ended') {
            const currentIndex = episodes.findIndex(e => e.episode_number === activeEpisode);
            if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
              const nextE = episodes[currentIndex + 1];
              setActiveEpisode(nextE.episode_number);
            }
          }

          if (["timeupdate", "pause", "ended"].includes(pEvent) && id && type && details) {
            const now = Date.now();
            if (currentTime) setCurrentProgress(parseFloat(currentTime));
            if (pEvent !== "timeupdate" || now - lastSaveTimeRef.current > 5000) {
              lastSaveTimeRef.current = now;
              saveProgress({
                id,
                mediaType: type as any,
                progress: parseFloat(progress),
                currentTime: parseFloat(currentTime),
                duration: parseFloat(duration),
                season: type === 'tv' ? activeSeason : undefined,
                episode: type === 'tv' ? activeEpisode : undefined,
                timestamp: timestamp || Date.now(),
                movieDetails: details
              }).catch(console.error);
            }
          }
        }
      } catch (e) {}
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [id, type, details, activeSeason, activeEpisode, episodes, initEpisode, resume]);

  if (!details && id) {
    return (
      <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl aspect-video rounded-[2rem] bg-white/5 animate-pulse" />
      </div>
    );
  }

  const embedUrl = getEmbedUrl();
  const iframeKey = `${id}-${type}-${activeSeason}-${activeEpisode}-${serverMode}`;
  const validSeasons = details?.seasons?.filter(s => s.season_number > 0) || [];
  const insideIframe = window.self !== window.top;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans">
      
      {/* Static Header */}
      {!isFullscreen && (
        <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between bg-[#111] border-b border-white/5 relative z-40">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">Back to Preview</span>
          </button>
          
          {insideIframe && (
            <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-colors">
              <Maximize className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-black tracking-widest">Open in New Tab to Play</span>
            </a>
          )}
          
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
             <span className="text-[10px] uppercase font-black tracking-widest text-white/20">Secured Node</span>
          </div>
        </div>
      )}

      <div className={cn("flex-1 w-full max-w-[1600px] mx-auto flex flex-col xl:flex-row gap-6 md:p-6 transition-all", isFullscreen && "p-0 max-w-none")}>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div 
            ref={playerContainerRef} 
            className={cn(
              "w-full bg-black relative touch-manipulation [webkit-tap-highlight-color:transparent]",
              isFullscreen 
                ? "fixed inset-0 z-[100] h-screen w-screen flex flex-col" 
                : "aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 w-full"
            )}
          >
            {embedUrl ? (
              <iframe 
                key={iframeKey}
                src={embedUrl}
                className="w-full h-full border-none outline-none z-0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                title="Video Player"
              />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full text-white/50 gap-4">
                <p>Loading transmission feed...</p>
              </div>
            )}

            <div className="absolute top-4 right-4 z-50 pointer-events-none">
              <button 
                onClick={toggleFullscreen}
                className="pointer-events-auto p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors shadow-xl"
              >
                {isFullscreen ? <X className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={cn("flex flex-col md:flex-row md:items-start justify-between gap-6", isFullscreen && "hidden")}>
            <div className="flex flex-col gap-2 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                {details?.title || details?.name} {type === 'tv' ? `— S${activeSeason} E${activeEpisode}` : ''}
              </h1>
              {type === 'tv' && (
                <p className="text-lg text-white/60">
                   {episodes.find(e => e.episode_number === activeEpisode)?.name || `Episode ${activeEpisode}`}
                </p>
              )}
              <p className="text-white/40 text-sm mt-2 max-w-3xl leading-relaxed line-clamp-3">
                {details?.overview}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
               <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                 {SERVER_PROVIDERS.map(sp => (
                    <button
                      key={sp.id}
                      onClick={() => { setServerMode(sp.id); localStorage.setItem('animedia_server', sp.id); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                        serverMode === sp.id ? "bg-[var(--color-accent)] text-black" : "text-white/40 hover:text-white"
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", sp.dot)} />
                      {sp.name.split(' ')[0]}
                    </button>
                 ))}
               </div>
               
               <button onClick={() => setShowDownloadModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full transition-colors text-[10px] font-black uppercase tracking-widest">
                <Download className="w-3.5 h-3.5" /> DL
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className={cn("w-full xl:w-[400px] flex flex-col gap-4 group/sidebar", isFullscreen && "hidden")}>
          <div className="flex-1 flex flex-col min-h-[500px]">
            <div className="flex-1 flex flex-col gap-4 bg-[#111] p-5 pt-8 rounded-[2.5rem] border border-white/5 max-h-[800px] overflow-y-auto no-scrollbar shadow-2xl backdrop-blur-3xl relative z-10">
              {type === 'tv' ? (
                    <>
                      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar border-b border-white/5 px-2 -mx-2 relative z-20">
                        {validSeasons.map((season, sIdx) => (
                        <button
                          key={`${season.season_number}-${sIdx}`}
                          onClick={() => { setActiveSeason(season.season_number); setActiveEpisode(1); }}
                          className={cn(
                            "shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            activeSeason === season.season_number 
                              ? 'bg-white text-black scale-105 shadow-xl shadow-white/10' 
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          )}
                        >
                          Season {season.season_number}
                        </button>
                        ))}
                      </div>

                      <div className="flex flex-col gap-3 rounded-xl mt-4">
                        {episodes.length > 0 ? (
                          episodes.map((episode, idx) => (
                            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={`${episode.id}-${idx}`} onClick={() => setActiveEpisode(episode.episode_number)} className={`flex gap-4 p-3 rounded-2xl text-left transition-all group ${activeEpisode === episode.episode_number ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
                              <div className="w-32 aspect-video bg-[#222] rounded-xl overflow-hidden shrink-0 relative border border-white/5">
                                {episode.still_path ? (
                                  <CachedImage src={getImageUrl(episode.still_path, 'w300')} type="movie" alt={episode.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase font-black tracking-tighter">No Feed</div>
                                )}
                                {activeEpisode === episode.episode_number && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                     <div className="w-4 h-4 rounded-full bg-[var(--color-accent)]/80 animate-pulse" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col justify-center py-1 overflow-hidden">
                                <span className={`text-[12px] font-bold truncate ${activeEpisode === episode.episode_number ? 'text-white' : 'text-white/60'}`}>{episode.episode_number}. {episode.name}</span>
                                <span className="text-[10px] text-white/20 mt-1 line-clamp-2 uppercase font-medium leading-tight">Data Log: {episode.overview || "Encrypted."}</span>
                              </div>
                            </motion.button>
                          ))
                        ) : (
                          <div className="p-8 flex flex-col gap-3 py-10 w-full">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="w-full h-20 bg-white/5 rounded-2xl animate-pulse" />
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <Film className="w-12 h-12 text-white/10 stroke-[1]" />
                       <span className="text-[10px] uppercase font-black tracking-widest text-white/20 italic">Recommendation logic calibrating...</span>
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>



      {showDownloadModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl text-white uppercase tracking-tighter">Transmission</h3>
              {downloadProgress === -1 && (
                <button onClick={() => setShowDownloadModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
              )}
            </div>
            
            {downloadProgress >= 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">{Math.min(100, Math.round(downloadProgress))}%</span>
                    <span className="text-white/50 text-xs uppercase tracking-widest">Downloading...</span>
                  </div>
                  <span className="text-white/50 text-xs font-mono">{downloadSize}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, downloadProgress)}%` }} 
                  />
                </div>
                {downloadProgress >= 100 && (
                  <p className="text-green-400 text-xs text-center font-bold uppercase tracking-widest mt-2">Download Complete</p>
                )}
              </div>
            ) : (
              <>
                <p className="text-white/60 text-sm leading-relaxed">Select export quality. Redirection will target the primary mirror node.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => startDownload('1080p Ultra')} className="px-6 py-4 border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest text-left transition-all flex justify-between items-center group">
                    <span>1080p Ultra</span>
                    <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                  </button>
                  <button onClick={() => startDownload('720p Standard')} className="px-6 py-4 border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest text-left transition-all flex justify-between items-center group">
                    <span>720p Standard</span>
                    <span className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
