import http from 'http';
import https from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const port = process.env.PORT || 3000;

const handleRequest = (req: IncomingMessage, res: ServerResponse) => {
    const urlParts = req.url?.split('/');

    if (!urlParts || urlParts.length < 2) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request' }));
        return;
    }

    const recipientServiceName = urlParts[1].toUpperCase();

    const recipientBaseURL = process.env[`${recipientServiceName}_BASE_URL`];

    if (!recipientBaseURL) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cannot process request' }));
        return;
    }

    const endpointPath = urlParts.slice(2).join('/');
    const targetURL = new URL(`${recipientBaseURL}/${endpointPath}`);

    const options = {
        hostname: targetURL.hostname,
        path: targetURL.pathname + (targetURL.search || ''),
        method: req.method,
        headers: {
            ...req.headers,
            'Content-Type': 'application/json',
        },
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode || 500, {
                'Content-Type': 'application/json',
            });
            res.end(data);
        });
    });

    req.on('data', (chunk) => {
        proxyReq.write(chunk);
    });

    req.on('end', () => {
        proxyReq.end();
    });

    proxyReq.on('error', (error) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
};

const server = http.createServer(handleRequest);

server.listen(port, () => {
    console.log(`BFF Service is running on http://localhost:${port}`);
});
