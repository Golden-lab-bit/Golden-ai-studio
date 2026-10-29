import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
// Wait for Firebase to restore the login session
let authInitialized = false;
let firebaseUser = null;
let resolveAuthReady;

const authReadyPromise = new Promise(resolve => {
    resolveAuthReady = resolve;
});

onAuthStateChanged(auth, user => {
    firebaseUser = user;

    if (!authInitialized) {
        authInitialized = true;
        resolveAuthReady(user);
    }
});
/* ==========================================
   GOLDEN AI STUDIO
   Backend + Generation + History
========================================== */

"use strict";

// 1. Backend URL
const API_BASE = "https://golden-ai-backend-rho.vercel.app";

// 2. Local storage key
const HISTORY_KEY = "goldenAIStudioHistory";

// 3. HTML elements
const messageInput = document.querySelector(".message-input");
const chatForm = document.querySelector(".chat-form");
const sendMessageButton = document.querySelector("#send-message");

const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(
    "#file-upload-wrapper"
) || document.querySelector(".file-upload-wrapper");

const fileCancelButton = document.querySelector("#file-cancel");
const fileUploadButton = document.querySelector("#file-upload");

const historyList = document.querySelector("#history-list");
const emptyHistory = document.querySelector("#empty-history");
const clearHistoryButton = document.querySelector("#clear-history");

const modeButtons = document.querySelectorAll(".mode-btn");
const filterButtons = document.querySelectorAll(".filter-btn");

// 4. Current generation mode
let currentMode = "image";
let currentFilter = "all";
let isGenerating = false;

// 5. Selected file preview
const userData = {
    file: null
};

// 6. Typed.js welcome animation
if (document.querySelector(".text") && typeof Typed !== "undefined") {
    new Typed(".text", {
        strings: [
            "Hi Welcome",
            "I'm Golden AI Studio",
            "Please wait we're upgrading",
            "We'll notify you when we finished",
        ],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
}

// ==========================================
// HISTORY FUNCTIONS
// ==========================================

// Get saved history
function getHistory() {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        const history = saved ? JSON.parse(saved) : [];

        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.error("Could not read history:", error);
        return [];
    }
}

// Save history
function saveHistory(history) {
    try {
        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(history)
        );
        return true;
    } catch (error) {
        console.error("Could not save history:", error);

        alert(
            "There's no result for this page. " +
            "Storage is full. " +
            "Extract result if you want."
        );

        return false;
    }
}

// Show or hide the empty history message
function updateEmptyHistory() {
    if (!historyList || !emptyHistory) return;

    const cards = historyList.querySelectorAll(".history-item");

    const visibleCards = Array.from(cards).filter(card => {
        return card.style.display !== "none";
    });

    emptyHistory.style.display =
        visibleCards.length === 0 ? "block" : "none";
}

// Create media element safely
function createMediaElement(item) {
    let element;

    if (item.category === "image") {
        element = document.createElement("img");
        element.alt = "Generated image";
        element.src = item.media;
    } else if (item.category === "video") {
        element = document.createElement("video");
        element.controls = true;
        element.preload = "metadata";
        element.src = item.media;
    } else if (item.category === "voice") {
        element = document.createElement("audio");
        element.controls = true;
        element.preload = "metadata";
        element.src = item.media;
    }

    return element;
}

// Create one history card
function createHistoryCard(item) {
    const card = document.createElement("article");
    card.className = "history-item";
    card.dataset.category = item.category;
    card.dataset.id = item.id;

    const prompt = document.createElement("p");
    prompt.textContent = "Prompt: " + item.prompt;
    card.appendChild(prompt);

    if (item.media) {
        const mediaElement = createMediaElement(item);

        if (mediaElement) {
            card.appendChild(mediaElement);
        }
    }

    if (item.status === "error") {
        const errorText = document.createElement("p");
        errorText.textContent = item.error || "Generation failed.";
        errorText.style.color = "#ff7777";
        card.appendChild(errorText);
    }

    if (item.status === "generating") {
        const loadingText = document.createElement("p");
        loadingText.textContent = "Generating... Please wait.";
        loadingText.style.color = "#00eeff";
        card.appendChild(loadingText);
    }

    const date = document.createElement("small");
    date.textContent = item.date
        ? new Date(item.date).toLocaleString()
        : "";

    date.style.cssText =
        "display:block;color:#aaa8bc;margin-top:10px;font-size:11px;";

    card.appendChild(date);

    return card;
}

// Display history in newest-first order
function renderHistory() {
    if (!historyList) return;

    historyList
        .querySelectorAll(".history-item")
        .forEach(card => card.remove());

    const history = getHistory();

    history.forEach(item => {
        const card = createHistoryCard(item);

        if (
            currentFilter !== "all" &&
            item.category !== currentFilter
        ) {
            card.style.display = "none";
        }

        historyList.appendChild(card);
    });

    updateEmptyHistory();
}

// Add or update a history item
function updateHistoryItem(item) {
    const history = getHistory();
    const index = history.findIndex(entry => entry.id === item.id);

    if (index !== -1) {
        history[index] = item;
    } else {
        history.unshift(item);
    }

    // Keep the most recent 30 items
    const limitedHistory = history.slice(0, 30);

    saveHistory(limitedHistory);
    renderHistory();
}

// ==========================================
// MODE BUTTONS
// ==========================================

modeButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentMode = button.dataset.mode;

        modeButtons.forEach(btn => {
            btn.classList.toggle("active", btn === button);
        });

        if (messageInput) {
            const placeholders = {
                image: "Describe the image you want to create...",
                video: "Describe the video you want to create...",
                voice: "Describe the voice or audio you want to generate..."
            };

            messageInput.placeholder =
                placeholders[currentMode] || "Enter your prompt...";
        }
    });
});

// ==========================================
// FILTER BUTTONS
// ==========================================

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter || "all";

        filterButtons.forEach(btn => {
            btn.classList.toggle("active", btn === button);
        });

        renderHistory();
    });
});

// ==========================================
// GENERATE IMAGE, VIDEO OR VOICE
// ==========================================

async function generateMediaResponse(historyItem, resultCard) {
    const endpoints = {
        image: "/api/image",
        video: "/api/video",
        voice: "/api/voice"
    };

    try {
        await authReadyPromise;

        const user = auth.currentUser;

        if (!user) {
            throw new Error("Please sign in before generating media.");
        }

        const idToken = await user.getIdToken();

        const response = await fetch(
            API_BASE + endpoints[historyItem.category],
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    prompt: historyItem.prompt,
                    aspectRatio:
                        historyItem.category === "video" ? "16:9" : "1:1"
                })
            }
        );

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("The backend returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(data.error || "Generation failed.");
        }

        // Video may take time, so check its job status.
        if (historyItem.category === "video" && data.jobId && !data.videoUrl) {
            let completed = false;

            for (let attempt = 0; attempt < 36; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 10000));

                const statusResponse = await fetch(
                    `${API_BASE}/api/video/${encodeURIComponent(data.jobId)}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${idToken}`
                        }
                    }
                );

                let statusData;

                try {
                    statusData = await statusResponse.json();
                } catch {
                    throw new Error("Could not read video status.");
                }

                if (!statusResponse.ok) {
                    throw new Error(
                        statusData.error || "Could not check video status."
                    );
                }

                if (["failed", "cancelled", "expired"].includes(statusData.status)) {
                    throw new Error(
                        statusData.error || "Video generation failed."
                    );
                }

                if (statusData.status === "completed" && statusData.videoUrl) {
                    data.videoUrl = statusData.videoUrl;
                    completed = true;
                    break;
                }
            }

            if (!completed) {
                throw new Error(
                    "Video is taking longer than expected. Please try again later."
                );
            }
        }

        let media = "";

        if (historyItem.category === "image") {
            media = data.image || "";
        } else if (historyItem.category === "voice") {
            media = data.audio || "";
        } else if (historyItem.category === "video") {
            media = data.videoUrl || "";
        }

        if (typeof media !== "string" || !media) {
            throw new Error("The backend did not return the generated media.");
        }

        historyItem.media = media;
        historyItem.status = "complete";
        historyItem.error = "";

        updateHistoryItem(historyItem);

    } catch (error) {
        console.error("Generation error:", error);

        historyItem.status = "error";
        historyItem.error = error.message || "Generation failed.";

        updateHistoryItem(historyItem);

    } finally {
        isGenerating = false;

        if (sendMessageButton) {
            sendMessageButton.disabled = false;
            sendMessageButton.style.opacity = "1";
        }

        if (messageInput) {
            messageInput.disabled = false;
        }

        if (resultCard) {
            resultCard.setAttribute("aria-busy", "false");
        }
    }
}

// ==========================================
// SEND PROMPT
// ==========================================

async function handleOutgoingMessage(event) {
    if (event) {
        event.preventDefault();
    }

    if (!messageInput || isGenerating) return;

    const promptText = messageInput.value.trim();

    if (!promptText) return;

    if (!["image", "video", "voice"].includes(currentMode)) {
        alert("Ka zaɓi Image, Video ko Voice.");
        return;
    }

    isGenerating = true;

    // Clear prompt immediately after Send
    messageInput.value = "";

    if (fileUploadWrapper) {
        fileUploadWrapper.classList.remove("file-uploaded");
    }

    if (fileInput) {
        fileInput.value = "";
    }

    userData.file = null;

    // Disable controls while generating
    if (sendMessageButton) {
        sendMessageButton.disabled = true;
        sendMessageButton.style.opacity = "0.6";
    }

    messageInput.disabled = true;

    const historyItem = {
        id: Date.now().toString() +
            "-" + Math.random().toString(36).slice(2, 9),
        prompt: promptText,
        category: currentMode,
        media: "",
        status: "generating",
        error: "",
        date: new Date().toISOString()
    };

    // Show the pending result in History
    updateHistoryItem(historyItem);

    const resultCard = historyList
        ? historyList.querySelector(
            `[data-id="${historyItem.id}"]`
        )
        : null;

    if (resultCard) {
        resultCard.setAttribute("aria-busy", "true");
        resultCard.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    await generateMediaResponse(historyItem, resultCard);
}

// ==========================================
// SEND BUTTON + FORM SUBMIT
// ==========================================

if (chatForm) {
    chatForm.addEventListener("submit", handleOutgoingMessage);
}

if (sendMessageButton) {
    sendMessageButton.addEventListener("click", event => {
        if (!chatForm) {
            handleOutgoingMessage(event);
        }
    });
}

// Enter sends; Shift + Enter creates a new line.
if (messageInput) {
    messageInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (isGenerating) return;

            if (chatForm && typeof chatForm.requestSubmit === "function") {
                chatForm.requestSubmit();
            } else {
                handleOutgoingMessage(event);
            }
        }
    });
}

// Enter sends; Shift + Enter creates a new line
if (messageInput && chatForm) {
    messageInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            if (typeof chatForm.requestSubmit === "function") {
                chatForm.requestSubmit();
            } else {
                handleOutgoingMessage(event);
            }
        }
    });
}

// ==========================================
// FILE PICKER / PREVIEW
// ==========================================

if (fileUploadButton && fileInput) {
    fileUploadButton.addEventListener("click", () => {
        fileInput.click();
    });
}

if (fileInput && fileUploadWrapper) {
    fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Da fatan zaɓi hoton image ne kawai.");
            fileInput.value = "";
            return;
        }

        // This only previews the file.
        // Your current backend generation routes do not use this upload.
        const reader = new FileReader();

        reader.onload = event => {
            const preview = fileUploadWrapper.querySelector("img");

            if (preview) {
                preview.src = event.target.result;
            }

            fileUploadWrapper.classList.add("file-uploaded");

            userData.file = {
                name: file.name,
                type: file.type
            };
        };

        reader.readAsDataURL(file);
    });
}

if (fileCancelButton && fileUploadWrapper) {
    fileCancelButton.addEventListener("click", () => {
        userData.file = null;

        if (fileInput) {
            fileInput.value = "";
        }

        const preview = fileUploadWrapper.querySelector("img");

        if (preview) {
            preview.removeAttribute("src");
        }

        fileUploadWrapper.classList.remove("file-uploaded");
    });
}

// ==========================================
// CLEAR HISTORY
// ==========================================

if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", () => {
        const confirmed = confirm(
            "Kana son share duk abubuwan da ke History?"
        );

        if (!confirmed) return;

        try {
            localStorage.removeItem(HISTORY_KEY);
            renderHistory();
        } catch (error) {
            console.error("Could not clear history:", error);
            alert("An kasa share History.");
        }
    });
}

// ==========================================
// LOAD SAVED HISTORY ON PAGE OPEN
// ==========================================

renderHistory();
