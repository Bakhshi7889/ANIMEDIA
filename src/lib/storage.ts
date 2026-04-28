import { openDB, DBSchema } from 'idb';
import { TMDBMovie } from '../services/tmdb';

export interface WatchProgress {
  id: string; // the string representation of TMDB ID
  mediaType: 'movie' | 'tv';
  progress: number; // percentage
  currentTime: number; // seconds
  duration: number; // seconds
  season?: number;
  episode?: number;
  timestamp: number;
  movieDetails: TMDBMovie; // Stored to display easily in list
}

interface CachedImage {
  url: string;
  type: 'character' | 'movie';
  lastUsed: number;
}

interface AnimediaDB extends DBSchema {
  favorites: {
    key: string;
    value: TMDBMovie;
  };
  progress: {
    key: string;
    value: WatchProgress;
    indexes: { 'by-timestamp': number };
  };
  imageCache: {
    key: string;
    value: CachedImage;
    indexes: { 'by-lastUsed': number };
  };
}

const DB_NAME = 'animedia-db';
const DB_VERSION = 2;

export async function initDB() {
  return openDB<AnimediaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('by-timestamp', 'timestamp');
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('imageCache')) {
          const imageStore = db.createObjectStore('imageCache', { keyPath: 'url' });
          imageStore.createIndex('by-lastUsed', 'lastUsed');
        }
      }
    },
  });
}

// --- Image Caching ---
// Switched to rely on Service Worker for image caching to improve UI responsiveness.

// --- Favorites ---
export async function toggleFavorite(movie: TMDBMovie): Promise<boolean> {
  const localDb = await initDB();
  const idStr = String(movie.id);
  const exists = await localDb.get('favorites', idStr);
  
  if (exists) {
    await localDb.delete('favorites', idStr);
    return false;
  } else {
    await localDb.put('favorites', movie);
    return true;
  }
}

export async function isFavorite(id: string | number): Promise<boolean> {
  const localDb = await initDB();
  return !!(await localDb.get('favorites', String(id)));
}

export async function getFavorites(): Promise<TMDBMovie[]> {
  const localDb = await initDB();
  return localDb.getAll('favorites');
}

// --- Watch Progress / Recently Watched ---
export async function saveProgress(progressData: WatchProgress) {
  const localDb = await initDB();
  await localDb.put('progress', progressData);
}

export async function getProgress(id: string | number): Promise<WatchProgress | undefined> {
  const localDb = await initDB();
  return localDb.get('progress', String(id));
}

export async function clearHistory(): Promise<void> {
  const localDb = await initDB();
  await localDb.clear('progress');
}

export async function syncUserData() {
  // Local storage only, nothing to sync
}

export async function getRecentlyWatched(limitCount = 10): Promise<WatchProgress[]> {
  const localDb = await initDB();
  const tx = localDb.transaction('progress', 'readonly');
  const index = tx.store.index('by-timestamp');
  
  let cursor = await index.openCursor(null, 'prev');
  const results: WatchProgress[] = [];
  
  while (cursor && results.length < limitCount) {
    if ((cursor.value.mediaType as string) !== 'hanime' && 
        (cursor.value.mediaType as string) !== 'rule34' && 
        (cursor.value.mediaType as string) !== 'hentaihaven') {
      results.push(cursor.value);
    }
    cursor = await cursor.continue();
  }
  
  return results;
}
