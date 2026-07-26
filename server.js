require('dotenv').config(); // 1. Load hidden credentials from .env first

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path'); // <-- 1. Require path module

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming JSON data from your React frontend
app.use(express.json());

// 2. Safely grab credentials and database name from environment variables
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;

const uri = `mongodb://${dbUser}:${dbPass}@localhost:27017/${dbName}`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function startServer() {
    try {
        // 3. Connect to the DCISM database server via your SSH tunnel
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected and pinged DCISM MongoDB!");

        // Attach database instance to the app so your routes can use it later
        app.locals.db = client.db(dbName);

        // 4. Test API Route (Keep this for backend checking)
        app.get('/api/health', (req, res) => {
            res.json({ status: 'Backend is running!' });
        });

        // ==========================================
        // 5. SERVE REACT FRONTEND IN PRODUCTION
        // ==========================================
        app.use(express.static(path.join(__dirname, 'client/build')));

        // Use a safe regex catch-all route that handles React routing 
        // without conflicting with express router path-to-regexp parsing
        app.get(/^(?!\/api).+/, (req, res) => {
            res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
        });

        // 6. Start the Express server
        app.listen(PORT, () => {
            console.log(`Backend server is running live on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to database:", error);
    }
}

startServer();