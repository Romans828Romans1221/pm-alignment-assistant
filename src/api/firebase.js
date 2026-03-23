import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRRfZDyVMpq5t6BNCyEf6M4Dx1rcMAVLE",
  authDomain: "clarity-pm-assistant-gcp.firebaseapp.com",
  projectId: "clarity-pm-assistant-gcp",
  storageBucket: "clarity-pm-assistant-gcp.firebasestorage.app",
  messagingSenderId: "132738195526",
  appId: "1:132738195526:web:2e13fb7c6012e1204c6a47",
  measurementId: "G-WGBLXJMTS8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});