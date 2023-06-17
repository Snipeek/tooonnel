import http from 'http';
import httpProxy from 'http-proxy';

const settings = {
  ws: true,
  target: {
    host: 'localhost',
    port: 6539
  }
};

let proxy = httpProxy.createProxyServer(settings);

const server = http.createServer(function(req, res) {
  const { pathname, searchParams } = new URL('http://localhost:5050' + req.url);

  if (pathname === '/tooonnel') {
    const ip = req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      null;

    const port = searchParams.get('port') || 6539;

    proxy = httpProxy.createProxyServer({
      ...settings,
      target: {
        host: ip,
        port,
      }
    });

    res.writeHead(200, { 'Content-Type': 'text/text' });
    res.write(ip + ':' + port);
    res.end();
    return;
  }
  proxy.web(req, res, settings);
});

server.on('upgrade', function (req, socket, head) {
  proxy.ws(req, socket, head);
});

server.listen(3000);

