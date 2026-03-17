const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    const urlParts = req.url.split('?');
    // Clean the URL: strip query params and trailing slash (unless it's just /)
    let requestPath = urlParts[0];
    if (requestPath.length > 1 && requestPath.endsWith('/')) {
        requestPath = requestPath.slice(0, -1);
    }

    let filePath = '.' + requestPath;

    if (filePath === './') {
        filePath = './index.html';
    }

    console.log(`[REQUEST] ${req.method} ${req.url} -> ${filePath}`);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            // If file not found, try appending .html
            if (error.code === 'ENOENT' && !filePath.endsWith('.html')) {
                const htmlPath = filePath + '.html';
                fs.readFile(htmlPath, (htmlError, htmlContent) => {
                    if (htmlError) {
                        res.writeHead(404);
                        res.end('404: File Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(htmlContent, 'utf-8');
                    }
                });
            } else {
                res.writeHead(error.code === 'ENOENT' ? 404 : 500);
                res.end(error.code === 'ENOENT' ? '404: File Not Found' : '500: Internal Server Error');
            }
        } else {
            const headers = { 'Content-Type': contentType };
            // Prevent caching for HTML, JS, CSS so admin changes appear immediately
            if (['.html', '.js', '.css'].includes(extname)) {
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                headers['Pragma'] = 'no-cache';
                headers['Expires'] = '0';
            }
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
