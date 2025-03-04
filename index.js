// IMPORTS
// Express is used to create the web server framework
import express from 'express';
// createServer creates an HTTP server instance for our Express app
import { createServer } from 'node:http';
// fileURLToPath converts file:// URLs to file paths
import { fileURLToPath } from 'node:url';
// dirname and join utilities for working with file paths
import { dirname, join } from 'node:path';
// Socket.IO enables real-time bidirectional event-based communication
import { Server } from 'socket.io';
// SQLite3 is a lightweight, disk-based database for storing messages
import sqlite3 from 'sqlite3';
// The open method provides a cleaner API for working with SQLite
import { open } from 'sqlite';

// DATABASE INITIALIZATION
// Opening a connection to the SQLite database
// - filename: Path to the database file (creates if doesn't exist)
// - driver: The SQLite engine to use
const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
});

// DATABASE SCHEMA SETUP
// Create a messages table with:
// - id: Auto-incrementing primary key for each message
// - client_offset: Unique identifier to prevent duplicate message handling
// - content: The actual message text
await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
`);

// SERVER SETUP
// Initialize Express application
const app = express();
// Create HTTP server using the Express app
const server = createServer(app);
// Attach Socket.IO to the HTTP server
// connectionStateRecovery helps clients reconnect and receive missed messages
const io = new Server(server, {
    connectionStateRecovery: {} // Empty object uses default configuration
});

// Get the directory path for the current module for serving static files
const __dirname = dirname(fileURLToPath(import.meta.url));

// ROUTE DEFINITION
// Serve the static HTML file for all requests to the root path
app.use('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// SOCKET.IO EVENT HANDLERS
// Handle new client connections
io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

    // ROOM MANAGEMENT
    // Extract room name from query parameter or default to 'default' room
    const room = socket.handshake.query.room || 'default';
    // Add the socket to the specified room
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);

    // MESSAGE HANDLING
    // Listen for 'chat message' events from clients
    socket.on('chat message', async (msg) => {
        let result;
        try {
            // Store message in the database
            // This creates a permanent record of all messages
            result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);

            // Broadcast the message to all clients in the same room
            // The lastID is sent to help with message tracking and recovery
            io.to(room).emit('chat message', msg, result.lastID);
        } catch (error) {
            // Log any database errors but don't crash the server
            console.error('Error saving message:', error);
            return;
        }
    });

    // CONNECTION RECOVERY
    // When a client reconnects, check if we need to send missed messages
    if (!socket.recovered) {
        try {
            // Query for messages the client might have missed during disconnection
            // socket.handshake.auth.serverOffset is the ID of the last message the client received
            await db.each(
                'SELECT id, content FROM messages WHERE id > ?',
                [socket.handshake.auth.serverOffset || 0],
                (_err, row) => {
                    // Send each missed message to the reconnected client
                    socket.emit('chat message', row.content, row.id);
                }
            );
        } catch (e) {
            console.error('Error recovering messages:', e);
        }
    }

    // DISCONNECTION HANDLING
    // Clean up when a client disconnects
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Note: Socket.IO automatically handles removing the socket from rooms
    });
});

// SERVER INITIALIZATION
// Start the server on port 3003
server.listen(3003, () => {
    console.log('Server running at http://localhost:3003');
}).on('error', (err) => {
    // Handle server startup errors gracefully
    console.error('Server error:', err);
});
