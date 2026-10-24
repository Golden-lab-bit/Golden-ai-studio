var typed = new Typed(".text", {
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

const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector("#file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const apiBase = "https://golden-ai-backend.onrender.com";
const chatForm = document.querySelector('.chat-form');
const historyList = document.getElementById('history-list');
const emptyHistory = document.getElementById('empty-history');

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

const generateMediaResponse = async (resultCard, mediaElement, promptText, mode = "image") => {
    let endpoint = `${apiBase}/api/image`;
    let requestBody = { prompt: promptText };

    if (mode === "voice") {
        endpoint = `${apiBase}/api/voice`;
        requestBody = { text: promptText };
    } else if (mode === "video") {
        endpoint = `${apiBase}/api/video`;
        requestBody = { prompt: promptText };
    } else if (mode === "image") {
        endpoint = `${apiBase}/api/image`;
        requestBody = { prompt: promptText, ratio: "1:1" };
    }

    const requestOption = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    };

    try {
        const response = await fetch(endpoint, requestOption);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unknown error");
        }

        if (mode === "image" && data.data) {
            mediaElement.innerHTML = `
                <p style="font-size: 13px; color: #aaa8bc; margin-bottom: 8px;">Prompt: ${promptText}</p>
                <img src="data:${data.mimeType};base64,${data.data}" alt="Generated Image" style="width:100%; border-radius:10px;">
            `;
            resultCard.setAttribute('data-category', 'image');
        } 
        else if (mode === "voice" && data.data) {
            mediaElement.innerHTML = `
                <p style="font-size: 13px; color: #aaa8bc; margin-bottom: 8px;">Prompt: ${promptText}</p>
                <audio controls style="width: 100%; margin-top: 8px;">
                    <source src="data:${data.mimeType};base64,${data.data}" type="${data.mimeType}">
                    Your browser does not support the audio element.
                </audio>
            `;
            resultCard.setAttribute('data-category', 'voice');
        } 
        else if (mode === "video" && data.data) {
            mediaElement.innerHTML = `
                <p style="font-size: 13px; color: #aaa8bc; margin-bottom: 8px;">Prompt: ${promptText}</p>
                <video controls style="width: 100%; margin-top: 8px; border-radius:10px;">
                    <source src="data:${data.mimeType};base64,${data.data}" type="${data.mimeType}">
                    Your browser does not support the video tag.
                </video>
            `;
            resultCard.setAttribute('data-category', 'video');
        } else {
            mediaElement.innerHTML = `<p style="color: #ff4d4d;">Sorry, couldn't generate.</p>`;
        }

    } catch (error) {
        console.error("API Error:", error);
        mediaElement.innerHTML = `<p style="color: #ff4d4d;">Error: ${error.message || "Please try again"}</p>`;
    } finally {
        userData.file = {};
    }
};

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    const promptText = messageInput.value.trim();
    if (!promptText) return;

    messageInput.value = "";
    if (fileUploadWrapper) {
        fileUploadWrapper.classList.remove("file-uploaded");
    }

    if (emptyHistory) {
        emptyHistory.style.display = 'none';
    }

    const currentMode = "image"; 

    const resultCard = document.createElement('div');
    resultCard.classList.add('history-item');
    resultCard.style.cssText = "background: #1c1c1c; padding: 15px; border-radius: 15px; border: 1px solid #29283a;";

    const mediaElement = document.createElement('div');
    mediaElement.innerHTML = `<p style="color: #0ef;">Generating ${currentMode}... Please wait...</p>`;
    resultCard.appendChild(mediaElement);

    if (historyList) {
        historyList.prepend(resultCard); 
    }

    generateMediaResponse(resultCard, mediaElement, promptText, currentMode);
};


if (sendMessageButton) {
    sendMessageButton.addEventListener("click", handleOutgoingMessage);
}

if (chatForm) {
    chatForm.addEventListener("submit", handleOutgoingMessage);
}

if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleOutgoingMessage(e);
        }
    });
}
