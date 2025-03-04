# Socket.IO Real-Time Chat Application

A real-time chat application built with Socket.IO, Express, and SQLite3. This application demonstrates bidirectional communication between clients and server with message persistence and connection recovery.

## Features

- **Real-time messaging**: Instant message delivery using WebSockets
- **Room-based chats**: Join different chat rooms using query parameters
- **Message persistence**: All messages stored in SQLite database
- **Connection recovery**: Automatic recovery of missed messages after disconnection
- **Simple, clean interface**: Easy-to-use chat interface

## Technologies

- **Socket.IO**: Real-time bidirectional event-based communication
- **Express**: Web server framework
- **SQLite3**: Lightweight disk-based database for message storage
- **Node.js**: JavaScript runtime

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://lakhman108/socket








































MIT## License- `chat.db`: SQLite database file that stores all messages- `index.html`: Client-side interface for the chat application- `index.js`: Main server file with Socket.IO, Express, and database configuration## Project Structure- Each message has a unique ID for tracking and ensuring delivery- When clients reconnect, they receive any messages they missed while disconnected- Messages sent by clients are stored in the database and broadcast to all users in the same room- Server listens for new connections and assigns them to rooms## How It Works   ```   http://localhost:3003?room=roomname   ```5. To join a specific room, use:   ```   http://localhost:3003   ```4. Open your browser and navigate to:   ```   node index.js   ```bash3. Start the server:   ```   npm install   ```bash2. Install dependencies:   ```   cd socket
