const WebSocket = require('ws');

// Create a WebSocket server on port 8081
const wss = new WebSocket.Server({ port: 8081 });

wss.on('connection', ws => {
  console.log('New client connected');

  // Listen for messages from the client
  ws.on('message', message => {
    console.log(`Received: ${message}`);
    
    // Broadcast the message to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // Forward the message to all clients
        client.send(message); // Broadcasting as it is, assuming the JSON structure from the client
      }
    });
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8081');
