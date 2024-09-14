// Connect to WebSocket server
const ws = new WebSocket('ws://localhost:8081');

// Event listener when WebSocket connection is open
ws.onopen = function () {
  console.log('Connected to the WebSocket server');
};

// Event listener for incoming messages
ws.onmessage = function (event) {
  const chat = document.getElementById('chat');
  const message = document.createElement('div');

  try {
    // Handle both Blob and string messages
    if (event.data instanceof Blob) {
      const reader = new FileReader();

      // Convert Blob to text
      reader.onload = function () {
        const parsedMessage = JSON.parse(reader.result);
        message.textContent = parsedMessage;
        message.className = 'message received';
        chat.appendChild(message);
        chat.scrollTop = chat.scrollHeight; // Scroll to bottom
      };

      reader.readAsText(event.data); // Read the Blob as text
    } else {
      // Handle string messages directly
      const parsedMessage = JSON.parse(event.data);
      message.textContent = parsedMessage;
      message.className = 'message received';
      chat.appendChild(message);
      chat.scrollTop = chat.scrollHeight; // Scroll to bottom
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
};

// Get the chat container and input elements
const chatContainer = document.getElementById('chat');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Add an event listener to the Send button
sendButton.addEventListener('click', sendMessage);

// Function to send a message
function sendMessage() {
  const message = messageInput.value.trim();
  if (message !== '') {
    // Create a new message element
    const messageElement = document.createElement('div');
    messageElement.className = 'message sent';
    messageElement.textContent = message;

    // Append the message to the chat container
    chatContainer.appendChild(messageElement);

    // Clear the input field
    messageInput.value = '';

    // Send the message to the server
    ws.send(JSON.stringify(message));
  }
}

// Event listener for 'Enter' key in the input field
document.getElementById('message-input').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent default action (e.g., new line)
    sendMessage(); // Trigger the send message function
  }
});