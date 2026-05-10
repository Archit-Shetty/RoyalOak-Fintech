import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCb33BTNYzvgU5wtvNIY6upWAtk3HpoCtI",
  authDomain: "royaloak-fintech.firebaseapp.com",
  projectId: "royaloak-fintech",
  storageBucket: "royaloak-fintech.firebasestorage.app",
  messagingSenderId: "951186265830",
  appId: "1:951186265830:web:dac4e2fcea90b629f54d27",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
