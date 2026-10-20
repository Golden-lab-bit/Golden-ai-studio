
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Logging in...";

    try {
        await signInWithEmailAndPassword(auth, email, password);

        window.location.href = "main.html";

    } catch (error) {
        console.error("Login error:", error.code);

        if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/user-not-found"
        ) {
            message.textContent = "Incorrect email or password.";
        } else if (error.code === "auth/invalid-email") {
            message.textContent = "Please enter a valid email.";
        } else {
            message.textContent =
                "Login failed: " + error.code;
        }
    }
});
