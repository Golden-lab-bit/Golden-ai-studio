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
            "What Shall We Generate Today?"
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
            "An kasa sakamakon a History na wannan shafin ba. " +
            "Storage ya cika ko sakamakon ya yi girma. " +
            "Zazzage sakamakon idan kana buƙatarsa."
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

async function generateMediaResponse(
    historyItem,
    resultCard
) {
    const endpoints = {
        image: "/api/image",
        video: "/api/video",
        voice: "/api/voice"
    };

    const endpoint = endpoints[historyItem.category];

    try {
        const response = await fetch(API_BASE + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: historyItem.prompt,
                aspectRatio: "1:1"
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("Backend bai dawo da amsa mai inganci ba.");
        }

        if (!response.ok) {
            throw new Error(
                typeof data.error === "string"
                    ? data.error
                    : "Generation failed. Please try again."
            );
        }

        // Match the response format used by your backend
        let media = "";

        if (historyItem.category === "image") {
            media = data.image || "";
        } else if (historyItem.category === "voice") {
            media = data.audio || "";
        } else if (historyItem.category === "video") {
            media = data.videoUrl || "";
        }

        if (typeof media !== "string" || !media) {
            throw new Error(
                "Backend ya amsa amma babu media a cikin amsar."
            );
        }

        historyItem.media = media;
        historyItem.status = "complete";
        historyItem.error = "";

        updateHistoryItem(historyItem);

    } catch (error) {
        console.error("Generation error:", error);

        historyItem.status = "error";
        historyItem.error =
            error.message || "An samu matsala. Ka sake gwadawa.";

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

// Use the form submit event only; no duplicate click listener
if (chatForm) {
    chatForm.addEventListener("submit", handleOutgoingMessage);
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
