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

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const apiBase = "https://golden-ai-backend.onrender.com";

// Create message element 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Generate AI Media (Image, Voice, or Video)
const generateMediaResponse = async (incomingMessageDiv, promptText, mode = "image") => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    
    let endpoint = `${apiBase}/api/image`;
    let requestBody = { prompt: promptText };

    // Selecting the path that goes according to the need
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

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    };

    try {
        const response = await fetch(endpoint, requestOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unknown API error");
        }

        // Idan Hoto ne aka dawo da shi
        if (mode === "image" && data.data) {
            messageElement.innerHTML = `
                <p>An ƙirƙiri hoton ka nasara:</p>
                <img src="data:${data.mimeType};base64,${data.data}" class="attachment" alt="Generated Image" style="max-width:100%; border-radius:10px;">
            `;
        } 
        // Idan Murya (Voice) ce aka dawo da ita
        else if (mode === "voice" && data.data) {
            messageElement.innerHTML = `
                <p>Ga muryar da aka ƙirƙira:</p>
                <audio controls style="width: 100%; margin-top: 8px;">
                    <source src="data:${data.mimeType};base64,${data.data}" type="${data.mimeType}">
                    Your browser does not support the audio element.
                </audio>
            `;
        } 
        // Idan Bidiyo ne aka dawo da shi
        else if (mode === "video" && data.data) {
            messageElement.innerHTML = `
                <p>Ga bidiyon da aka ƙirƙira:</p>
                <video controls style="width: 100%; margin-top: 8px; border-radius:10px;">
                    <source src="data:${data.mimeType};base64,${data.data}" type="${data.mimeType}">
                    Your browser does not support the video tag.
                </video>
            `;
        } else {
            messageElement.textContent = "Ba a samu sakamako ba.";
        }

    } catch (error) {
        console.error("API Error:", error);
        messageElement.textContent = `Matsala: ${error.message || "An error occurred."}`;
    } finally {
        incomingMessageDiv.classList.remove("thinking");
        if (chatBody) {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        }
    }
};

// Handle outgoing message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    // You can change  'image' to 'voice' or 'video' As much as you want it to do
    // (A gaba za mu iya saka zaɓe/dropdown ko tab domin mutum ya zaɓi abin da yake so)
    const currentMode = "image"; // Za ka iya sanya shi ya zama 'image', 'voice', ko 'video'

    // 1. Show important message
    const outgoingMessageDiv = createMessageElement(`<div class="message-text"></div>`, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = message;
    chatBody.appendChild(outgoingMessageDiv);

    messageInput.value = "";

    // 2. Show "Thinking..." when waiting
    const incomingMessageDiv = createMessageElement('<div class="message-text">Generating... Please wait...</div>', "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // 3. Send request to Backend
    generateMediaResponse(incomingMessageDiv, message, currentMode);
};

// (Event Listeners)
if (sendMessageButton) {
    sendMessageButton.addEventListener("click", handleOutgoingMessage);
}

if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleOutgoingMessage(e);
        }
    });
}
