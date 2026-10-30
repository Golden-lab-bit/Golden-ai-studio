import { auth } from "./firebase.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

"use strict";

// Golden AI Studio backend
const API_BASE = "https://golden-ai-backend-rho.vercel.app";

const statusBox = document.getElementById("payment-status");
const payButtons = document.querySelectorAll(".pay-btn");

document.getElementById("year").textContent =
    new Date().getFullYear();

// Wait for Firebase to restore the user's login session
let resolveAuthReady;

const authReadyPromise = new Promise(resolve => {
    resolveAuthReady = resolve;
});

let authUser = null;

onAuthStateChanged(auth, user => {
    authUser = user;
    resolveAuthReady(user);
});

function showStatus(message, type = "info") {
    statusBox.textContent = message;
    statusBox.className = `status ${type}`;
    statusBox.hidden = false;
}

function hideStatus() {
    statusBox.hidden = true;
    statusBox.textContent = "";
}

function setButtonsDisabled(disabled, activeButton = null) {
    payButtons.forEach(button => {
        button.disabled = disabled;

        const span = button.querySelector("span");

        if (!span) return;

        if (button === activeButton && disabled) {
            button.dataset.originalText = span.textContent;
            span.textContent = "Please wait...";
        } else if (!disabled && button.dataset.originalText) {
            span.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    });
}

async function getCurrentUserToken() {
    await authReadyPromise;

    const user = auth.currentUser || authUser;

    if (!user) {
        throw new Error(
            "Please sign in to your Golden AI Studio account before paying."
        );
    }

    return await user.getIdToken();
}

async function postToBackend(path, body, token) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.error || data.message ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}

// Start Paystack payment
async function startPayment(plan, button) {
    hideStatus();
    setButtonsDisabled(true, button);

    try {
        const token = await getCurrentUserToken();

        const result = await postToBackend(
            "/api/payments/initialize",
            { plan },
            token
        );

        const paymentUrl =
            result.authorization_url || result.authorizationUrl;

        if (!paymentUrl) {
            throw new Error(
                "Paystack authorization URL was not returned by the backend."
            );
        }

        const checkoutUrl = new URL(paymentUrl);

        if (
            checkoutUrl.protocol !== "https:" ||
            ![
                "checkout.paystack.com",
                "paystack.com"
            ].some(domain =>
                checkoutUrl.hostname === domain ||
                checkoutUrl.hostname.endsWith("." + domain)
            )
        ) {
            throw new Error("Unexpected Paystack payment URL.");
        }

        window.location.assign(checkoutUrl.href);

    } catch (error) {
        console.error("Payment initialization failed:", error);

        showStatus(
            error.message || "Unable to start payment.",
            "error"
        );

        setButtonsDisabled(false);
    }
}

// Payment buttons
payButtons.forEach(button => {
    button.addEventListener("click", () => {
        const plan = button.dataset.plan;

        if (!["daily", "weekly", "monthly", "yearly"].includes(plan)) {
            showStatus("Invalid plan selected.", "error");
            return;
        }

        startPayment(plan, button);
    });
});

// Verify Paystack payment after returning
async function verifyPaymentReturn() {
    const params = new URLSearchParams(window.location.search);

    const reference =
        params.get("reference") || params.get("trxref");

    const paymentReturn = params.get("payment") === "return";

    if (!reference || !paymentReturn) return;

    showStatus("Checking your payment securely...", "info");

    try {
        const token = await getCurrentUserToken();

        const result = await postToBackend(
            "/api/payments/verify",
            { reference },
            token
        );

        if (
            result.success === true ||
            result.status === "success" ||
            result.paymentStatus === "success"
        ) {
            showStatus(
                "Payment verified successfully. Your subscription has been activated.",
                "success"
            );
        } else {
            showStatus(
                result.message ||
                "Payment has not been confirmed yet.",
                "info"
            );
        }

    } catch (error) {
        console.error("Payment verification failed:", error);

        showStatus(
            error.message +
            " If you were charged, do not pay again until you check your transaction status.",
            "error"
        );

    } finally {
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );
    }
}

// Wait for Firebase before checking payment return
authReadyPromise.then(user => {
    if (user) {
        verifyPaymentReturn();
    } else {
        const params = new URLSearchParams(window.location.search);

        if (params.has("reference")) {
            showStatus(
                "Please sign in to verify your payment.",
                "error"
            );
        }
    }
});
