
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5UybI2hD7G7pWxV8gSgmDiPdtrNoALto",
  authDomain: "golden-ai-studio.firebaseapp.com",
  projectId: "golden-ai-studio",
  storageBucket: "golden-ai-studio.firebasestorage.app",
  messagingSenderId: "203319391695",
  appId: "1:203319391695:web:a6b2cb89f6a40d7b318eba",
  measurementId: "G-64FP8LEHB3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
