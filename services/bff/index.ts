import http from 'http';
import https from 'https';
import { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { URL } from 'url';
import NodeCache from 'node-cache';

dotenv.config();

const port = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 120 });

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

    if (recipientServiceName === 'PRODUCT' && endpointPath === 'products') {
        const cachedProducts = cache.get('products');

        if (cachedProducts) {
            console.log('Returning cached products');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(cachedProducts));
            return;
        }
    }

    const options = {
        hostname: targetURL.hostname,
        path: targetURL.pathname + (targetURL.search || ''),
        method: req.method,
        headers: {
            ...req.headers,
            'Content-Type': 'application/json',
            'Host': targetURL.hostname,
        },
        servername: targetURL.hostname,
    };

    const proxyReq = https.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
            data += chunk;
        });

        proxyRes.on('end', () => {
            if (recipientServiceName === 'PRODUCT' && endpointPath === 'products' && proxyRes.statusCode === 200) {
                cache.set('products', JSON.parse(data));
                console.log('Caching products');
            }

            res.writeHead(proxyRes.statusCode || 500, {
                'Content-Type': 'application/json',
            });
            res.end(data);
        });
    });

    proxyReq.on('error', (error) => {
        console.log("Request error:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });

    req.on('data', (chunk) => {
        proxyReq.write(chunk);
    });

    req.on('end', () => {
        proxyReq.end();
    });
};

const server = http.createServer(handleRequest);

server.listen(port, () => {
    console.log(`BFF Service is running on http://localhost:${port}`);
});
