// TODO: Replace with your Firebase project's credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "YOUR_DATABASE_URL" // For Realtime Database
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Basic JavaScript for the chat app
console.log("Chat app script loaded.");

// Get DOM Element References
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesArea = document.getElementById('messages-area');

// Firebase Realtime Database reference to messages
const messagesRef = firebase.database().ref('messages');

// Function to send a message
function sendMessage() {
    const text = messageInput.value.trim();
    if (text !== "") {
        const newMessage = {
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        messagesRef.push(newMessage);
        messageInput.value = ''; // Clear the input field
    }
}

// Event Listeners for sending messages
if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
}

if (messageInput) {
    messageInput.addEventListener('keypress', function(event) {
        // Check if Enter key is pressed (and Shift key is not, to allow new lines if desired in future)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default form submission or new line
            sendMessage();
        }
    });
}

// Listen for new messages and display them
if (messagesRef) {
    messagesRef.on('child_added', snapshot => {
        const message = snapshot.val();
        if (message && message.text && messagesArea) {
            const messageElement = document.createElement('div');
            messageElement.textContent = message.text;
            messageElement.classList.add('new-message'); // For CSS animation

            // Optionally, add a timestamp
            if (message.timestamp) {
                const timestampElement = document.createElement('span');
                timestampElement.style.fontSize = '0.8em';
                timestampElement.style.marginLeft = '10px';
                timestampElement.style.color = '#888';
                timestampElement.textContent = new Date(message.timestamp).toLocaleTimeString();
                messageElement.appendChild(timestampElement);
            }

            messagesArea.appendChild(messageElement);
            messagesArea.scrollTop = messagesArea.scrollHeight; // Scroll to the bottom
        }
    });
}
