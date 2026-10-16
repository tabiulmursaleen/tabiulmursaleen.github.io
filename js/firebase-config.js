
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7pTTvD_2lD_ppKUzNXj-KHV06cZ1nvWo",
  authDomain: "tabiulmursaleen.firebaseapp.com",
  projectId: "tabiulmursaleen",
  storageBucket: "tabiulmursaleen.firebasestorage.app",
  messagingSenderId: "719610584550",
  appId: "1:719610584550:web:484951d569bd4fd3658a27"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
