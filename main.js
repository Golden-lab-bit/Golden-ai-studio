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

// 👉 KA SANYA OPENAI API KEY DIN KA A NAN 👇
const OPENAI_API_KEY = "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";

// Create message element 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Generate AI Response using OpenAI API
const generateMediaResponse = async (incomingMessageDiv, promptText) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    try {
        const url = "https://api.openai.com/v1/chat/completions";
        
        const requestBody = {
            model: "gpt-4o-mini", // Zaka iya amfani da gpt-3.5-turbo ko wani model din na OpenAI
            messages: [
                { role: "user", content: promptText }
            ]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Unknown OpenAI API error");
        }

        // Daukar amsar da OpenAI ya bada
        const replyText = data.choices?.[0]?.message?.content;
        if (replyText) {
            messageElement.textContent = replyText;
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

    // 1. Show user message
    const outgoingMessageDiv = createMessageElement(`<div class="message-text"></div>`, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = message;
    chatBody.appendChild(outgoingMessageDiv);

    messageInput.value = "";

    // 2. Show "Thinking..." when waiting
    const incomingMessageDiv = createMessageElement('<div class="message-text">Generating... Please wait...</div>', "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // 3. Send request to OpenAI API
    generateMediaResponse(incomingMessageDiv, message);
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
