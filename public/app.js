// UI Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const micStatus = document.getElementById('micStatus');

// Initialize the realtime chat
async function init() {
    try {
        // Get an ephemeral key from our server
        const tokenResponse = await fetch("/session");
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.client_secret.value;

        // Create a peer connection
        const pc = new RTCPeerConnection();

        // Set up to play remote audio from the model
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
        pc.ontrack = e => audioEl.srcObject = e.streams[0];

        // Add local audio track for microphone input
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        pc.addTrack(stream.getTracks()[0]);
        micStatus.classList.add('active');

        // Set up data channel for sending and receiving events
        const dc = pc.createDataChannel("oai-events");
        dc.addEventListener("message", (e) => {
            const event = JSON.parse(e.data);
            if (event.type === 'text') {
                addMessage(event.text, false);
            }
        });

        // Start the session using SDP
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2025-06-03";
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                "Content-Type": "application/sdp"
            },
        });

        const answer = {
            type: "answer",
            sdp: await sdpResponse.text(),
        };
        await pc.setRemoteDescription(answer);

        // Handle text input
        sendButton.addEventListener('click', () => {
            const text = userInput.value.trim();
            if (text) {
                addMessage(text, true);
                dc.send(JSON.stringify({ type: 'text', text }));
                userInput.value = '';
            }
        });

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendButton.click();
            }
        });

    } catch (error) {
        console.error("Error initializing chat:", error);
        addMessage("Error initializing chat. Please check console for details.", false);
        micStatus.style.opacity = '0.3';
    }
}

// Add a message to the chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Start the chat
init();