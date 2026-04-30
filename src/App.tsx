import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import InstallPrompt from "./components/InstallPrompt";
import { SettingsProvider } from "./context/SettingsContext";

import Home from "./pages/Home";
// Lazy load pages for better performance
const Search = lazy(() => import("./pages/Search"));
const Details = lazy(() => import("./pages/Details"));
const Player = lazy(() => import("./pages/Player"));
const Library = lazy(() => import("./pages/Library"));
const Settings = lazy(() => import("./pages/Settings"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Actor = lazy(() => import("./pages/Actor"));
const Explore = lazy(() => import("./pages/Explore"));

const PageLoader = () => (
  <div className="min-h-screen bg-[#050505] flex items-center justify-center">
    <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[var(--color-accent)] animate-spin" />
  </div>
);

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
          <InstallPrompt />
        </Suspense>
      </BrowserRouter>
    </SettingsProvider>
  );
}
