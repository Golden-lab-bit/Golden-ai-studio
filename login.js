import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("message");
const submitButton = document.getElementById("login-submit");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    message.textContent = "Logging in...";
    submitButton.disabled = true;

    try {
        await signInWithEmailAndPassword(auth, email, password);

        message.textContent = "Login successful. Opening studio...";

        // Canza wannan zuwa index.html idan shi ne main page ɗinka.
        window.location.replace("main.html");

    } catch (error) {
        console.error("Login error:", error.code, error.message);

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

        submitButton.disabled = false;
    }
});
