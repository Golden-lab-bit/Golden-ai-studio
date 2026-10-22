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

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

const generateMediaResponse = async (
    incomingMessageDiv,
    promptText
) => {
    const messageElement =
        incomingMessageDiv.querySelector(".message-text");

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: promptText
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error || `Request failed (${response.status})`
            );
        }

        messageElement.textContent =
            data.reply || "No result found.";

    } catch (error) {
        console.error("Backend error:", error);
        messageElement.textContent =
            `Error: ${error.message || "there's problem."}`;
    } finally {
        incomingMessageDiv.classList.remove("thinking");

        if (chatBody) {
            chatBody.scrollTo({
                top: chatBody.scrollHeight,
                behavior: "smooth"
            });
        }
    }
};

const handleOutgoingMessage = (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();

    if (!message || !chatBody) return;

    const outgoingMessageDiv = createMessageElement(
        '<div class="message-text"></div>',
        "user-message"
    );

    outgoingMessageDiv.querySelector(".message-text")
        .textContent = message;

    chatBody.appendChild(outgoingMessageDiv);
    messageInput.value = "";

    const incomingMessageDiv = createMessageElement(
        '<div class="message-text">Generating... Please wait...</div>',
        "bot-message",
        "thinking"
    );

    chatBody.appendChild(incomingMessageDiv);

    chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth"
    });

    generateMediaResponse(incomingMessageDiv, message);
};

if (sendMessageButton) {
    sendMessageButton.addEventListener(
        "click",
        handleOutgoingMessage
    );
}

if (messageInput) {
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleOutgoingMessage(e);
        }
    });
}
