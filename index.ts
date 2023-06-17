import http from 'http';
import httpProxy from 'http-proxy';

const settings = { ws: true };

const createProxy = (ip, port) => {
  const proxy = httpProxy.createProxyServer({
    ...settings,
    target: {
      host: ip,
      port,
    }
  });

  proxy.on('error', function (err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });

    console.log(err);

    res.end('Something went wrong. And we are reporting a custom error message.');
  });

  return proxy;
}

let proxy = createProxy('localhost', 6539);

const server = http.createServer(function(req, res) {
  const { pathname, searchParams } = new URL('http://localhost:5050' + req.url);

  if (pathname === '/tooonnel') {
    const ip = req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      null;

    const port = searchParams.get('port') || 6539;

    proxy = createProxy('ip', port);

    res.writeHead(200, { 'Content-Type': 'text/text' });
    res.end(ip + ':' + port);
    return;
  }
  proxy.web(req, res, settings);
});

server.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head);
});

server.listen(3000);

