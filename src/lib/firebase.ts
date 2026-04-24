import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDocFromServer, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { useState, useEffect } from 'react';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();

// Standard login
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Sync user data to Firestore
    const userRef = doc(db, 'users', result.user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        id: result.user.uid,
        displayName: result.user.displayName || 'Anonymous User',
        photoURL: result.user.photoURL || ''
      });
    }
  } catch (error) {
    console.error("Login failed:", error);
  }
};

export const signOut = () => firebaseSignOut(auth);

// Hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}

// Comments Interface
export interface VideoComment {
  id: string;
  mediaId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  videoTimeMs: number;
  createdAt: number;
}

export const addComment = async (mediaId: string, user: User, text: string, videoTimeMs: number) => {
  const commentsRef = collection(db, 'comments');
  // Need to use id from docref or let firestore handle
  const newDocRef = doc(commentsRef);
  await setDoc(newDocRef, {
    mediaId,
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    userPhoto: user.photoURL || '',
    text,
    videoTimeMs,
    createdAt: serverTimestamp() // Wait, my rules check for request.time == data.createdAt. serverTimestamp() IS request.time!
  });
};

export function useComments(mediaId: string) {
  const [comments, setComments] = useState<VideoComment[]>([]);

  useEffect(() => {
    if (!mediaId) return;
    const q = query(
      collection(db, 'comments'),
      where('mediaId', '==', mediaId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert serverTimestamp to an approximate local number if null
          createdAt: data.createdAt?.toMillis() || Date.now()
        } as VideoComment;
      });
      setComments(docs);
    });

    return unsubscribe;
  }, [mediaId]);

  return comments;
}
