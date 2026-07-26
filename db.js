require('dotenv').config(); // Load dotenv here so process.env works
const { MongoClient, ServerApiVersion } = require('mongodb');

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

async function connectDB() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected and pinged DCISM MongoDB!");
        return client.db(dbName);
    } catch (error) {
        console.error("Error connecting to DCISM MongoDB:", error);
        process.exit(1);
    }
}

module.exports = connectDB;