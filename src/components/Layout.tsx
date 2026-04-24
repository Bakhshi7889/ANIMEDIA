import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search, Home, Heart, CalendarClock, TrendingUp, Settings, HelpCircle, Film, Bell, Play, User, LogIn, Flame } from "lucide-react";
import { useAuth, signInWithGoogle } from "../lib/firebase";
import { cn } from "../lib/utils";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDetailsOrPlay = location.pathname.startsWith('/details') || location.pathname.startsWith('/play') || location.pathname.startsWith('/actor');

  // Desktop Links
  const navLinks = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Heart, label: "Favorites", path: "/library" },
    { icon: Play, label: "Watching", path: "/timeline" },
    { icon: TrendingUp, label: "Trending", path: "/search" }
  ];

  // Mobile Links (Purrweb style)
  const mobileNavLinks = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Play, label: "Watching", path: "/timeline", center: true },
    { icon: Heart, label: "Favorites", path: "/library" },
    { icon: User, label: "Profile", path: "/settings" }
  ];

  const bottomLinks = [
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: HelpCircle, label: "Support", path: "/settings" },
  ];

  const [searchCategory, setSearchCategory] = useState("All");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#0e1518] lg:bg-[#0e1518] max-lg:bg-[#050505] text-[#f9f8ff] font-sans selection:bg-yellow-500/30">
      
      {/* Desktop Sidebar (lg screens and up) */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-[#0e1518] z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <Film className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Animedia</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] mt-0.5">Alpha Edition</span>
          </div>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2 mt-4">
          {navLinks.map((item) => (
            <Link 
              key={item.label}
              to={item.path} 
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                location.pathname === item.path 
                  ? "text-white bg-white/5 relative after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-1/2 after:bg-white after:rounded-r-full" 
                  : "text-[#959ca3] hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "fill-white/10 shrink-0" : "shrink-0")} />
              {item.label}
            </Link>
          ))}

          <div className="mt-8 mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-[#959ca3]/50">General</div>
          
          {bottomLinks.map((item) => (
            <Link 
              key={item.label}
              to={item.path} 
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                location.pathname === item.path 
                  ? "text-white bg-white/5" 
                  : "text-[#959ca3] hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Wrap */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen relative w-full">
        
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-[#0e1518]/90 backdrop-blur-xl px-6 py-4 flex-row gap-4 items-center justify-between">
          <div className="flex items-center w-full sm:w-auto gap-4 flex-1 justify-end max-w-4xl lg:ml-auto">
            {/* Category Dropdown & Search Combo */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const query = new FormData(form).get('q') as string;
            let q = query ? encodeURIComponent(query) : '';
            navigate(q ? `/search?q=${q}&cat=${searchCategory.toLowerCase()}` : '/search');
          }}
          className="flex items-center bg-[var(--color-surface)] rounded-[var(--radius-full)] w-full sm:w-[500px] border border-white/5 h-12 focus-within:border-white/20 transition-colors ring-1 ring-black/20 shadow-inner"
        >
          <div className="relative h-full flex items-center">
            <button 
              type="button" 
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="h-full px-4 border-r border-white/10 text-sm font-medium text-[#959ca3] hover:text-white flex items-center gap-2 shrink-0 rounded-l-[var(--radius-full)] whitespace-nowrap"
            >
              {searchCategory} <span className="text-[10px] opacity-70">▼</span>
            </button>
            {showCategoryMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCategoryMenu(false)} />
                <div className="absolute top-full left-0 mt-2 w-32 bg-[#1a2226] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                   {['All', 'Movies', 'TV Shows', 'Anime'].map(cat => (
                     <button
                       key={cat}
                       type="button"
                       onClick={() => { setSearchCategory(cat); setShowCategoryMenu(false); }}
                       className="w-full text-left px-4 py-2 text-sm text-[#959ca3] hover:text-white hover:bg-white/5 transition-colors"
                     >
                       {cat}
                     </button>
                   ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center flex-1 px-3 gap-2 h-full">
            <Search className="w-5 h-5 text-[#959ca3]" />
            <input 
              type="text"
              name="q"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-full h-full text-white placeholder:text-[#959ca3]"
            />
          </div>
          <button type="submit" className="hidden">Search</button>
        </form>

            <button className="w-12 h-12 rounded-full bg-[#1a2226] border border-white/5 flex items-center justify-center shrink-0 text-[#959ca3] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            {user ? (
               <div onClick={() => navigate('/settings')} className="flex items-center gap-3 bg-[#1a2226] p-1.5 pr-4 rounded-full border border-white/5 shrink-0 cursor-pointer hover:bg-[#20292f] transition-colors">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "Avatar"} className="w-9 h-9 rounded-full bg-orange-200 object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center font-bold text-black uppercase">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col">
                     <span className="text-sm font-medium leading-none truncate max-w-[100px]">{user.displayName || "User"}</span>
                     <span className="text-[10px] text-[var(--color-accent)] font-medium text-opacity-80">Premium</span>
                  </div>
               </div>
            ) : (
               <div onClick={signInWithGoogle} className="flex items-center justify-center gap-2 bg-[#1a2226] px-5 h-12 rounded-full border border-white/5 shrink-0 cursor-pointer hover:bg-[#20292f] transition-colors">
                  <LogIn className="w-4 h-4 text-[#959ca3]" />
                  <span className="text-sm font-medium text-white whitespace-nowrap">Sign In</span>
               </div>
            )}
          </div>
        </header>

        {/* Mobile Header (All orientations under lg threshold) */}
        {!isDetailsOrPlay && (
          <header className="lg:hidden pt-12 pt-safe pb-2 px-6 flex items-center justify-between z-40 bg-gradient-to-b from-[#050505] to-transparent sticky top-0 w-full pointer-events-none">
             <div className="flex items-center gap-3 pointer-events-auto">
                <div className="flex items-baseline gap-2">
                   <span className="font-bold text-xl tracking-tight text-white drop-shadow-md">Animedia</span>
                   <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] border border-[var(--color-accent)] px-1.5 py-0.5 rounded-sm bg-[var(--color-accent)]/10 backdrop-blur-sm">Alpha</span>
                </div>
             </div>
             <div className="pointer-events-auto">
               {user ? (
                 <div onClick={() => navigate('/settings')} className="cursor-pointer border-2 border-transparent hover:border-white/20 rounded-full transition-all">
                    {user.photoURL ? (
                       <img src={user.photoURL} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                       <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center font-bold text-black uppercase">
                         {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                       </div>
                    )}
                 </div>
               ) : (
                 <button onClick={signInWithGoogle} className="bg-white/10 backdrop-blur-xl p-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all text-white flex items-center justify-center">
                    <LogIn className="w-4 h-4" />
                 </button>
               )}
             </div>
          </header>
        )}

        <main className={cn("flex-1 w-full max-w-full overflow-x-hidden", !isDetailsOrPlay ? "pb-24 lg:pb-12 lg:p-6" : "")}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Purrweb Style) */}
      {!isDetailsOrPlay && (
        <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[85%] max-w-[400px] bg-[#1a2226]/80 backdrop-blur-3xl p-1.5 rounded-[2rem] flex items-center justify-around shadow-[0_20px_40px_rgba(0,0,0,0.8)] pb-1.5 pt-1.5 border border-white/10">
          {mobileNavLinks.map(item => (
            <Link 
              key={item.label}
              to={item.path} 
              className={cn(
                item.center ? "-mt-8 bg-[var(--color-accent)] text-black p-4 shadow-[0_10px_30px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95" : "p-3 bg-transparent",
                "rounded-full transition-all duration-300",
                location.pathname === item.path && !item.center ? "text-white" : !item.center ? "text-[#959ca3] hover:text-white" : ""
              )}
              title={item.label}
            >
              <item.icon className="w-6 h-6" strokeWidth={location.pathname === item.path ? 2.5 : 2} fill={location.pathname === item.path && item.icon !== Search && item.icon !== User ? "currentColor" : "none"} />
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
