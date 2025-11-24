import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- PASTE YOUR FIREBASE CONFIG HERE (Same as in script.js) ---
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "clarity-pm-assistant-gcp.firebaseapp.com",
  // ... the rest of your keys
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // If logged in, go straight to the dashboard
        window.location.href = 'index.html';
    }
});

// Handle Login Button
document.getElementById('loginBtn').addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("User signed in:", result.user);
            // Success! Redirect to main page
            window.location.href = 'index.html';
        }).catch((error) => {
            alert("Login failed: " + error.message);
        });
});