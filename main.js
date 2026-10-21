
/* ==============================
   GOLDEN AI STUDIO
   Frontend Chat API Connection
============================== */

// Welcome typing animation
if (typeof Typed !== "undefined" && document.querySelector(".text")) {
    new Typed(".text", {
        strings: [
            "Hi Welcome",
            "I'm Golden AI Studio",
            "What Shall We Do Today?"
        ],
        typeSpeed: 100,
        backSpeed: 100,
        backDelay: 1000,
        loop: true
    });
}

// Backend URL on Render
const API_BASE = "https://golden-ai-backend.onrender.com";

// HTML elements
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");

// Ka tabbatar ID ɗin button a HTML ɗinka shi ne #send-message
const sendMessageButton = document.querySelector("#send-message");

const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");

// User message and image
const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

// Create message element
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// Generate AI response using Render backend
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement =
        incomingMessageDiv.querySelector(".message-text");

    try {
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: userData.message,
                image: userData.file.data
                    ? {
                        data: userData.file.data,
                        mime_type: userData.file.mime_type
                    }
                    : null
            })
        };

        // Correct endpoint: /api/chat
        const response = await fetch(
            `${API_BASE}/api/chat`,
            requestOptions
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "The AI request failed."
            );
        }

        // The backend returns { reply: "AI response" }
        messageElement.textContent =
            data.reply || "Sorry, no response was generated.";

    } catch (error) {
        console.error("Golden AI Studio API Error:", error);

        messageElement.textContent =
            `Error: ${error.message}. Please try again.`;

    } finally {
        userData.file = {
            data: null,
            mime_type: null
        };

        if (fileInput) {
            fileInput.value = "";
        }

        if (fileUploadWrapper) {
            fileUploadWrapper.classList.remove("file-uploaded");
        }

        incomingMessageDiv.classList.remove("thinking");

        if (chatBody) {
            chatBody.scrollTo({
                top: chatBody.scrollHeight,
                behavior: "smooth"
            });
        }
    }
};

// Handle outgoing message
const handleOutgoingMessage = (e) => {
    e.preventDefault();

    if (!chatBody || !messageInput) return;

    const message = messageInput.value.trim();

    if (!message && !userData.file.data) return;

    userData.message = message || "Please analyze this image.";

    // Show user's message and uploaded image
    const messageContent = `
        <div class="message-text"></div>
        ${
            userData.file.data &&
            userData.file.mime_type.startsWith("image/")
                ? `
                    <img
                        src="data:${userData.file.mime_type};base64,${userData.file.data}"
                        class="attachment"
                        alt="Uploaded image"
                        style="max-width:200px; border-radius:10px;"
                    >
                `
                : ""
        }
    `;

    const outgoingMessageDiv = createMessageElement(
        messageContent,
        "user-message"
    );

    outgoingMessageDiv.querySelector(".message-text").textContent =
        userData.message;

    chatBody.appendChild(outgoingMessageDiv);

    // Clear input
    messageInput.value = "";

    if (fileUploadWrapper) {
        fileUploadWrapper.classList.remove("file-uploaded");
    }

    // Show thinking message
    const incomingMessageDiv = createMessageElement(
        '<div class="message-text">Thinking...</div>',
        "bot-message",
        "thinking"
    );

    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });

    // Call backend
    generateBotResponse(incomingMessageDiv);
};

// Send message on button click
if (sendMessageButton) {
    sendMessageButton.addEventListener(
        "click",
        handleOutgoingMessage
    );
} else {
    console.warn(
        'Send button not found. Check that your HTML uses id="send-message".'
    );
}

// Send message by pressing Enter
if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleOutgoingMessage(e);
        }
    });
}

// Handle image upload
if (fileInput) {
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            fileInput.value = "";
            return;
        }

        // Keep uploads within a reasonable size
        if (file.size > 5 * 1024 * 1024) {
            alert("Please choose an image smaller than 5 MB.");
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            userData.file.data = reader.result.split(",")[1];
            userData.file.mime_type = file.type;

            if (fileUploadWrapper) {
                fileUploadWrapper.classList.add("file-uploaded");
            }
        };

        reader.onerror = () => {
            alert("Could not read the image. Please try again.");
            fileInput.value = "";
        };

        reader.readAsDataURL(file);
    });
}
