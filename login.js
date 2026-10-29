import { auth } from "./firebase.js";

import {
GoogleAuthProvider,
signInWithPopup,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const googleButton = document.getElementById("google-login");
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const submitButton = document.getElementById("login-submit");

// Google login
googleButton?.addEventListener("click", async () => {
try {
googleButton.disabled = true;
message.textContent = "Connecting to Google...";

    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);

    message.textContent = "Login successful. Opening studio...";
    window.location.replace("main.html");

} catch (error) {
    console.error("Google login error:", error.code, error.message);

    if (error.code === "auth/popup-blocked") {
        message.textContent = "Google popup was blocked. Allow popups and try again.";
    } else if (error.code === "auth/popup-closed-by-user") {
        message.textContent = "Google sign-in was cancelled. Please try again.";
    } else {
        message.textContent = "Google login failed: " + error.code;
    }
} finally {
    googleButton.disabled = false;
}

});

// Email and password login
loginForm?.addEventListener("submit", async (event) => {
event.preventDefault();

const email = emailInput.value.trim();
const password = passwordInput.value;

message.textContent = "Logging in...";
submitButton.disabled = true;

try {
    await signInWithEmailAndPassword(auth, email, password);

    message.textContent = "Login successful. Opening studio...";
    window.location.replace("main.html");

} catch (error) {
    console.error("Email login error:", error.code, error.message);

    if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
    ) {
        message.textContent = "Incorrect email or password.";
    } else if (error.code === "auth/invalid-email") {
        message.textContent = "Please enter a valid email address.";
    } else if (error.code === "auth/too-many-requests") {
        message.textContent = "Too many attempts. Please try again later.";
    } else {
        message.textContent = "Login failed: " + error.code;
    }
} finally {
    submitButton.disabled = false;
}

});
