import net from 'node:net';
import WebSocket from 'ws';

const transactions = {};

const port = 6539;
const server = 'tooonnel.jusp.me:49206';

if (port && server) {
  // Создаем подключение к серверу с использованием WebSocket
  const ws = new WebSocket(`wss://${server}`);

  ws.on('open', () => {
    console.log(`Connected. Forwarding traffic to: localhost:${port}`);
  });

  ws.on('message', (message) => {
    // Обрабатываем входящие сообщения от сервера
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'notice') {
      const newData = parsedMessage.data.replace(/\$SERVER/g, server.replace(/:\d*/, ''));
      console.log(newData);
    }

    if (parsedMessage.type === 'event') {
      const { data, transId } = parsedMessage;

      if (!transactions[transId]) {
        const client = new net.Socket();
        client.connect(port, '127.0.0.1', function() {
          console.log('Connected');
          client.write(data);
        });

        client.on('data', function(clientData) {
          ws.send(JSON.stringify({ type: `event-${transId}`, data: clientData }));
        });

        client.on('error', console.error);

        client.on('close', function() {
          console.log('Connection closed');
          client.destroy();
        });

        transactions[transId] = { ws, client };
      } else {
        const { client } = transactions[transId];
        client.write(data);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
}
