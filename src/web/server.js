const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../../config.json');
const { updateStaffRoles } = require('./middleware/auth');
const { checkIPBan, getClientIP, calculateThreatLevel } = require('./middleware/ipBan');

let io = null;
let discordClient = null;

async function startWebServer(client) {
    discordClient = client;

    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    io = wss;

    app.set('trust proxy', true);

    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
        app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: false,
            crossOriginResourcePolicy: false,
            originAgentCluster: false
        }));
    } else {
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "http://questcord.fun"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:", "http:"],
                    connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"]
                },
                upgradeInsecureRequests: null  // Don't force HTTPS - Cloudflare handles it
            },
            crossOriginOpenerPolicy: false,  // Disable for Cloudflare compatibility
            crossOriginResourcePolicy: false,  // Disable for Cloudflare compatibility
            originAgentCluster: false  // Disable for Cloudflare compatibility
        }));
    }

    app.use(cors({
        origin: true,
        credentials: true
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(checkIPBan);

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        keyGenerator: (req) => getClientIP(req)
    });
    app.use(limiter);

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    app.use(express.static(path.join(__dirname, '../../public')));

    const apiRoutes = require('./routes/api');
    const adminRoutes = require('./routes/admin');
    const webRoutes = require('./routes/web');

    app.use('/api', apiRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/', webRoutes);

    app.use((req, res) => {
        const threatLevel = calculateThreatLevel(req.path);
        const ip = getClientIP(req);

        if (threatLevel === 'critical') {
            console.log(`[SECURITY] Critical threat detected from ${ip}: ${req.path}`);
        }

        res.status(404).render('404', {
            path: req.path,
            threatLevel: threatLevel,
            ip: ip
        });
    });

    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).render('404', {
            path: req.path,
            threatLevel: 'none',
            ip: getClientIP(req)
        });
    });

    wss.on('connection', (ws) => {
        console.log('New WebSocket connection');

        ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
    });

    setInterval(() => updateStaffRoles(client, broadcastStaff), 30000);
    updateStaffRoles(client, broadcastStaff);

    const port = process.env.NODE_ENV === 'production' ? config.productionPort : config.port;

    server.listen(port, () => {
        console.log(`Web server running on port ${port}`);
    });

    return server;
}

function broadcastActivity(activity) {
    if (!io) return;

    io.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'activity', data: activity }));
        }
    });
}

function broadcastStats(stats) {
    if (!io) return;

    io.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'stats', data: stats }));
        }
    });
}

function broadcastLeaderboard(leaderboard) {
    if (!io) return;

    io.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'leaderboard', data: leaderboard }));
        }
    });
}

function broadcastStaff(staff) {
    if (!io) return;

    io.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'staff', data: staff }));
        }
    });
}

function getDiscordClient() {
    return discordClient;
}

module.exports = { startWebServer, broadcastActivity, broadcastStats, broadcastLeaderboard, broadcastStaff, getDiscordClient };
