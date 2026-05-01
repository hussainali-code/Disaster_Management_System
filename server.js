const express = require('express');
const cors = require('cors');
const expressWs = require('express-ws');
require('dotenv').config();

const app = express();
expressWs(app); // enable WebSocket support

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'], // React frontend URLs
    credentials: true,
}));
app.use(express.json());             // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth',      require('./src/routes/auth.routes'));
app.use('/api/reports',   require('./src/routes/reports.routes'));
app.use('/api/teams',     require('./src/routes/teams.routes'));
app.use('/api/resources', require('./src/routes/resources.routes'));
app.use('/api/hospitals', require('./src/routes/hospitals.routes'));
app.use('/api/finance',   require('./src/routes/finance.routes'));
app.use('/api/approvals', require('./src/routes/approvals.routes'));
app.use('/api/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/events',    require('./src/routes/events.routes'));
app.use('/api/users',     require('./src/routes/users.routes'));

// ============================================================
// WEBSOCKET — real-time updates broadcast to connected clients
// ============================================================
const wsClients = new Set();

app.ws('/ws', (ws, req) => {
    wsClients.add(ws);
    console.log('WebSocket client connected. Total:', wsClients.size);

    ws.on('close', () => {
        wsClients.delete(ws);
        console.log('WebSocket client disconnected. Total:', wsClients.size);
    });
});

// Helper function — call this from any controller to broadcast updates
// e.g. broadcast({ type: 'NEW_REPORT', data: report })
const broadcast = (payload) => {
    const message = JSON.stringify(payload);
    wsClients.forEach(client => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(message);
        }
    });
};

// Export broadcast so controllers can use it
app.locals.broadcast = broadcast;

// ============================================================
// HEALTH CHECK — visit http://localhost:5000/health to verify server is running
// ============================================================
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Disaster MIS API is running',
        timestamp: new Date().toISOString(),
    });
});

// ============================================================
// 404 HANDLER — catches any unknown route
// ============================================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ============================================================
// GLOBAL ERROR HANDLER — catches any unhandled server errors
// ============================================================
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
====================================
  Disaster MIS Backend running
  http://localhost:${PORT}
  Health: http://localhost:${PORT}/health
====================================
    `);
});
