import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Details from "./pages/Details";
import Player from "./pages/Player";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import Timeline from "./pages/Timeline";
import Actor from "./pages/Actor";
import Explore from "./pages/Explore";
import { useAuth } from "./lib/firebase";
import { syncUserData } from "./lib/storage";

export default function App() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      syncUserData();
    }
  }, [user]);

  useEffect(() => {
    const applySettings = () => {
      const color = localStorage.getItem('animedia_color') || 'facc15';
      document.documentElement.style.setProperty('--color-accent', '#' + color.replace('#', ''));
      
      const uiStyle = localStorage.getItem('animedia_ui_style') || 'roundy';
      document.documentElement.setAttribute('data-ui-style', uiStyle);
    };

    window.addEventListener('settings_updated', applySettings);
    applySettings(); // Apply on mount
    return () => window.removeEventListener('settings_updated', applySettings);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="library" element={<Library />} />
          <Route path="settings" element={<Settings />} />
          <Route path="details/:type/:id" element={<Details />} />
          <Route path="actor/:id" element={<Actor />} />
        </Route>
        <Route path="/explore" element={<Explore />} />
        {/* Player handles its own full-screen layout */}
        <Route path="/play/:type/:id" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}
