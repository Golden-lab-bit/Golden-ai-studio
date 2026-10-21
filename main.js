
var typed = new Typed(".text", {
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

const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-messages");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");

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

// Generate AI response
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement =
        incomingMessageDiv.querySelector(".message-text");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: userData.message },
                    ...(userData.file.data
                        ? [{
                            inline_data: {
                                mime_type: userData.file.mime_type,
                                data: userData.file.data
                            }
                        }]
                        : [])
                ]
            }]
        })
    };

    try {
        // API_URL must point to a compatible AI API endpoint.
        const API_BASE = "https://golden-ai-backend.onrender.com";
  
        const response = await fetch(`${API_BASE}/generate`, requestOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Unknown API error"
            );
        }

        if (data.candidates?.length > 0) {
            const apiResponseText =
                data.candidates[0].content.parts
                    .map(part => part.text || "")
                    .join("\n")
                    .replace(/\*\*(.*?)\*\*/g, "$1")
                    .trim();

            messageElement.textContent =
                apiResponseText || "No response was generated.";
        } else {
            messageElement.textContent =
                "Sorry, I couldn't generate a response.";
        }
    } catch (error) {
        console.error("API Error:", error);
        messageElement.textContent =
            "An error occurred. Please try again.";
    } finally {
        userData.file = {
            data: null,
            mime_type: null
        };

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

    const message = messageInput.value.trim();

    if (!message && !userData.file.data) return;

    userData.message = message || "Please analyze this file.";

    const messageContent = `
        <div class="message-text"></div>
        ${userData.file.data &&
          userData.file.mime_type.startsWith("image/")
            ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}"
                    class="attachment"
                    alt="Uploaded image"
                    style="max-width:200px;">`
            : ""}
    `;

    const outgoingMessageDiv = createMessageElement(
        messageContent,
        "user-message"
    );

    outgoingMessageDiv.querySelector(".message-text")
        .textContent = userData.message;

    chatBody.appendChild(outgoingMessageDiv);

    messageInput.value = "";

    if (fileUploadWrapper) {
        fileUploadWrapper.classList.remove("file-uploaded");
    }

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

    generateBotResponse(incomingMessageDiv);
};

// Send message on button click
if (sendMessageButton) {
    sendMessageButton.addEventListener(
        "click",
        handleOutgoingMessage
    );
}

// Send message by pressing Enter
if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handleOutgoingMessage(e);
        }
    });
}

// Handle file upload
if (fileInput) {
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
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

        reader.readAsDataURL(file);
    });
}
