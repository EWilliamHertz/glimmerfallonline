import http from 'node:http';

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 8080,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:8080' },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end('Bad gateway');
  });

  req.pipe(proxyReq);
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Port 3000 proxy listening and forwarding to port 8080');
});
