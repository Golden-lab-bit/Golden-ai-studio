"use strict";

// Your Golden AI Studio backend
const API_BASE = "https://golden-ai-backend-rho.vercel.app";

// Replace these example values with your Firebase Web App config.
// Firebase Console > Project settings > General > Your apps.
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const statusBox = document.getElementById("payment-status");
const payButtons = document.querySelectorAll(".pay-btn");

document.getElementById("year").textContent = new Date().getFullYear();

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
  payButtons.forEach((button) => {
    button.disabled = disabled;

    if (button === activeButton && disabled) {
      button.dataset.originalText = button.querySelector("span").textContent;
      button.querySelector("span").textContent = "Please wait...";
    } else if (!disabled && button.dataset.originalText) {
      button.querySelector("span").textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  });
}

function firebaseIsConfigured() {
  return firebaseConfig.apiKey !== "YOUR_FIREBASE_WEB_API_KEY" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    firebaseConfig.appId !== "YOUR_FIREBASE_APP_ID";
}

let auth = null;

try {
  if (firebaseIsConfigured()) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
  } else {
    console.warn("Add your Firebase Web App config in pricing.js.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

async function getCurrentUserToken() {
  if (!auth) {
    throw new Error("Firebase is not configured. Add your Firebase Web App settings first.");
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in to your Golden AI Studio account before paying.");
  }

  return user.getIdToken();
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
    throw new Error(data.error || data.message || `Request failed (${response.status}).`);
  }

  return data;
}

async function startPayment(plan, button) {
  hideStatus();
  setButtonsDisabled(true, button);

  try {
    const token = await getCurrentUserToken();

    // Backend must decide the price from the plan ID.
    // Never send a trusted price from browser JavaScript.
    const result = await postToBackend(
      "/api/payments/initialize",
      { plan },
      token
    );

    const paymentUrl = result.authorization_url || result.authorizationUrl;

    if (!paymentUrl) {
      throw new Error(
        "Backend did not return a Paystack authorization URL. Check the /api/payments/initialize response."
      );
    }

    // Only redirect to Paystack's trusted checkout domain.
    const checkoutUrl = new URL(paymentUrl);

    if (
      checkoutUrl.protocol !== "https:" ||
      !["checkout.paystack.com", "paystack.com"].some(
        (domain) =>
          checkoutUrl.hostname === domain ||
          checkoutUrl.hostname.endsWith("." + domain)
      )
    ) {
      throw new Error("The backend returned an unexpected payment URL.");
    }

    window.location.assign(checkoutUrl.href);
  } catch (error) {
    console.error("Payment initialization failed:", error);
    showStatus(error.message || "Unable to start payment. Please try again.", "error");
    setButtonsDisabled(false);
  }
}

payButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;

    if (!["daily", "weekly", "monthly", "yearly"].includes(plan)) {
      showStatus("Invalid plan selected.", "error");
      return;
    }

    startPayment(plan, button);
  });
});

// Verify a Paystack callback after returning to this page.
// The backend must verify the reference directly with Paystack.
async function verifyPaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference") || params.get("trxref");
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

    if (result.success === true || result.status === "success" || result.paymentStatus === "success") {
      showStatus(
        "Payment verified successfully. Your subscription has been activated.",
        "success"
      );
    } else {
      showStatus(
        result.message || "Payment has not been confirmed yet. Please refresh or contact support.",
        "info"
      );
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    showStatus(
      `${error.message} If you were charged, do not pay again until you check your transaction status.`,
      "error"
    );
  } finally {
    // Remove callback parameters from the visible address.
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

if (auth) {
  auth.onAuthStateChanged(() => {
    verifyPaymentReturn();
  });
} else if (new URLSearchParams(window.location.search).has("reference")) {
  showStatus("Configure Firebase to verify the payment under your signed-in account.", "error");
}
