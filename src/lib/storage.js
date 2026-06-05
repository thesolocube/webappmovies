import { auth, db } from '../firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';

const currentAuth = auth;

function mapFirebaseUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
  };
}

export function getCurrentUser() {
  return mapFirebaseUser(currentAuth.currentUser);
}

export function logout() {
  return signOut(currentAuth);
}

export async function registerUser(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(currentAuth, email, password);
    return { success: true, user: mapFirebaseUser(result.user) };
  } catch (error) {
    return { success: false, message: error.message || 'Erreur lors de l\'inscription.' };
  }
}

export async function authenticateUser(email, password) {
  try {
    const result = await signInWithEmailAndPassword(currentAuth, email, password);
    return { success: true, user: mapFirebaseUser(result.user) };
  } catch (error) {
    return { success: false, message: error.message || 'Email ou mot de passe invalide.' };
  }
}

function favoritesCollection(uid) {
  return collection(db, 'users', uid, 'favorites');
}

function historyCollection(uid) {
  return collection(db, 'users', uid, 'history');
}

export async function saveFavoriteItem(movie) {
  const current = getCurrentUser();
  if (!current) return;
  const docRef = doc(favoritesCollection(current.uid), `${movie.mediaType}_${movie.movieId}`);
  await setDoc(docRef, {
    ...movie,
    lastWatchedTime: Date.now(),
  });
}

export async function removeFavoriteItem(movie) {
  const current = getCurrentUser();
  if (!current) return;
  const docRef = doc(favoritesCollection(current.uid), `${movie.mediaType}_${movie.movieId}`);
  await deleteDoc(docRef);
}

export async function isFavorite(movie) {
  const current = getCurrentUser();
  if (!current) return false;
  const docRef = doc(favoritesCollection(current.uid), `${movie.mediaType}_${movie.movieId}`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
}

export async function getUserFavorites() {
  const current = getCurrentUser();
  if (!current) return [];
  const favoritesSnapshot = await getDocs(favoritesCollection(current.uid));
  return favoritesSnapshot.docs.map((docSnapshot) => docSnapshot.data());
}

export async function getUserHistory() {
  const current = getCurrentUser();
  if (!current) return [];
  const historyQuery = query(historyCollection(current.uid), orderBy('lastWatchedTime', 'desc'));
  const historySnapshot = await getDocs(historyQuery);
  return historySnapshot.docs.map((docSnapshot) => docSnapshot.data());
}

export async function addHistoryItem(movie) {
  const current = getCurrentUser();
  if (!current) return;
  const docRef = doc(historyCollection(current.uid), `${movie.mediaType}_${movie.movieId}`);
  await setDoc(docRef, {
    ...movie,
    lastWatchedTime: Date.now(),
  });
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(currentAuth, (user) => callback(mapFirebaseUser(user)));
}
