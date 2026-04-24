import { openDB, DBSchema } from 'idb';
import { TMDBMovie } from '../services/tmdb';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, orderBy, limit as fsLimit } from 'firebase/firestore';

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
export async function updateImageMetadata(url: string, type: 'character' | 'movie'): Promise<void> {
  try {
    const localDb = await initDB();
    await localDb.put('imageCache', {
      url,
      type,
      lastUsed: Date.now()
    });
  } catch (err) {
    console.error('Failed to update image metadata', err);
  }
}

export async function cleanupImages() {
  try {
    const localDb = await initDB();
    const tx = localDb.transaction('imageCache', 'readwrite');
    const index = tx.store.index('by-lastUsed');
    
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * ONE_DAY;

    let cursor = await index.openCursor();
    const urlsToDelete: string[] = [];

    while (cursor) {
      const item = cursor.value;
      const age = now - item.lastUsed;
      
      const shouldDelete = 
        (item.type === 'character' && age > ONE_DAY) ||
        (item.type === 'movie' && age > SEVEN_DAYS);

      if (shouldDelete) {
        urlsToDelete.push(item.url);
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
    
    if (urlsToDelete.length > 0 && 'caches' in window) {
      const cache = await caches.open('tmdb-images');
      for (const url of urlsToDelete) {
        await cache.delete(url);
      }
    }
  } catch (err) {
    console.error('Failed to cleanup images', err);
  }
}

// --- Favorites ---
export async function toggleFavorite(movie: TMDBMovie): Promise<boolean> {
  const localDb = await initDB();
  const idStr = String(movie.id);
  const exists = await localDb.get('favorites', idStr);
  const user = auth.currentUser;
  
  if (exists) {
    await localDb.delete('favorites', idStr);
    if (user) {
      try { await deleteDoc(doc(db, `users/${user.uid}/favorites/${idStr}`)); } catch(e){}
    }
    return false;
  } else {
    await localDb.put('favorites', movie);
    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/favorites/${idStr}`), {
          id: idStr,
          userId: user.uid,
          timestamp: Date.now(),
          movieDetails: movie
        });
      } catch(e) {}
    }
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
  
  const user = auth.currentUser;
  if (user) {
    try {
      await setDoc(doc(db, `users/${user.uid}/progress/${progressData.id}`), {
        ...progressData,
        userId: user.uid
      });
    } catch(e) {}
  }
}

export async function getProgress(id: string | number): Promise<WatchProgress | undefined> {
  const localDb = await initDB();
  return localDb.get('progress', String(id));
}

export async function clearHistory(): Promise<void> {
  const localDb = await initDB();
  await localDb.clear('progress');
  const user = auth.currentUser;
  if (user) {
      try {
          const q = collection(db, `users/${user.uid}/progress`);
          const snaps = await getDocs(q);
          snaps.forEach(async (d) => {
              await deleteDoc(d.ref);
          });
      } catch(e) {}
  }
}

export async function syncUserData() {
  const user = auth.currentUser;
  if (!user) return;
  const localDb = await initDB();
  
  try {
    const favsQuery = collection(db, `users/${user.uid}/favorites`);
    const favsSnap = await getDocs(favsQuery);
    const txFav = localDb.transaction('favorites', 'readwrite');
    for (const doc of favsSnap.docs) {
      const data = doc.data();
      if (data.movieDetails) {
        txFav.store.put(data.movieDetails);
      }
    }
    await txFav.done;

    const progQuery = collection(db, `users/${user.uid}/progress`);
    const progSnap = await getDocs(progQuery);
    const txProg = localDb.transaction('progress', 'readwrite');
    for (const doc of progSnap.docs) {
      const data = doc.data() as Pick<WatchProgress, keyof WatchProgress>;
      txProg.store.put(data);
    }
    await txProg.done;
  } catch (error) {
    console.error("Failed to sync user data from Firebase:", error);
  }
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
