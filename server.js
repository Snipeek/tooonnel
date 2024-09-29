import WebSocket, { WebSocketServer } from 'ws';
import net from 'node:net';

const port = 8080;
const HOST = '0.0.0.0';

const generateTransactionId = length => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const listener = websocket => sock => {
  if (!websocket) return;

  // TCP-соединение установлено
  console.log(`CONNECTED: ${sock.remoteAddress}:${sock.remotePort}`);

  const transId = generateTransactionId(32);
  const eventString = `event`;

  websocket.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.event === `${eventString}-${transId}`) {
      sock.write(parsedMessage.data);
    }
  });

  sock.on('data', data => {
    // Отправляем данные через WebSocket
    websocket.send(JSON.stringify({ event: eventString, data, transId }));
  });

  sock.on('close', () => {
    websocket.send(JSON.stringify({ event: 'close', transId }));
    console.log(`CLOSED: ${sock.remoteAddress} ${sock.remotePort}`);
  });
};

let server = null;

const createServer = (port, websocket = null) => {
  if (server) server.close();

  server = net.createServer(listener(websocket)).listen(port, HOST);

  if (websocket) {
    websocket.on('close', () => server.close());
  }

  console.log(`Created server for webhook on port ${port}`);
};

let connections = [];
createServer(port);

// Создаем WebSocket сервер на порту 5050
const wss = new WebSocketServer({ port: 5050 });

wss.on('connection', (ws) => {
  console.log('A user connected');

  createServer(port, ws);

  ws.send(JSON.stringify({ event: 'notice', data: `Server listening on: $SERVER:${port}` }));

  const connection = {
    id: '',
    sendEvent: (eventType, args) => ws.send(JSON.stringify({ event: eventType, data: args })),
    socket: ws,
  };

  connections.push(connection);

  ws.on('close', () => {
    connections = connections.filter(conn => conn.socket !== ws);
    console.log('User disconnected');
  });
});

console.log('WebSocket server is listening on *:5050');
