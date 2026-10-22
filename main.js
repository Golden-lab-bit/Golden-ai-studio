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

// 👉 KA SANYA GEMINI API KEY DIN KA A NAN 👇
const GEMINI_API_KEY = "AQ.Ab8RN6KCKw4E2RW4qQA36ZFcSg886jgztF2iRrVpeWlc-Quk4A";

// Create message element 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Generate AI Media 
const generateMediaResponse = async (incomingMessageDiv, promptText, mode = "image") => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    try {
        // We are using Google Gemini API Endpoint real in Frontend
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const requestBody = {
            contents: [{
                parts: [{ text: promptText }]
            }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Unknown API error");
        }

        // Taking Gemini's response
        const candidate = data.candidates?.[0];
        if (candidate && candidate.content?.parts?.[0]?.text) {
            const replyText = candidate.content.parts[0].text;
            messageElement.textContent = replyText;
        } else {
            messageElement.textContent = "No results were found.";
        }

    } catch (error) {
        console.error("API Error:", error);
        messageElement.textContent = `Error: ${error.message || "An error occurred."}`;
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

    const currentMode = "image"; // You can turn it to 'image', 'voice', or 'video'

    // 1. Show user message
    const outgoingMessageDiv = createMessageElement(`<div class="message-text"></div>`, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = message;
    chatBody.appendChild(outgoingMessageDiv);

    messageInput.value = "";

    // 2. Show "Thinking..." when waiting
    const incomingMessageDiv = createMessageElement('<div class="message-text">Generating... Please wait...</div>', "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // 3. Send request to Google Gemini API
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
