import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';

const db=await open({
    filename:'chat.db',
    driver:sqlite3.Database
})

await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        content TEXT
    );
  `);

const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {}
  });


const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection' ,async (socket)=>{

    console.log('connection done',socket.id)
    // socket.on('changecolor',async (msg)=>{
    //     console.log('change color emiited');
    // })
    socket.join('lucky',async (msg) =>{
        console.log("this is from lucky room deer",msg);

        io.to('lucky').emit('changecolor','red');
    })
    socket.on('chat message',async (msg)=>{

        let result;
    try {
        result=await db.run('insert into messages (content) values (?)',msg);
    } catch (error) {
        return;
    }
        io.emit('chat message',msg,result.lastID);
    })



    if(!socket.recovered) {
        // if the connection state recovery was not successful
    try {
        console.log("socket recovered");
        await db.each('SELECT id, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', row.content, row.id);

          }
        )
      } catch (e) {
        // something went wrong
      }
    }



    socket.on('disconnect',()=>{
        console.log('disconnected');
    })


})

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
