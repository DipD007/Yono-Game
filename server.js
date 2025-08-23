const express = require('express');
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');
const requireAuth = require('./middleware/requireAuth');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Firestore setup
const db = new Firestore({
    projectId: 'yono-game',
    keyFilename: 'serviceAccountKey.json', // Path to your key file
});

const gamesCollection = db.collection('games');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Routes
// Public API to get all games
app.get('/api/games', async (req, res) => {
    try {
        const snapshot = await gamesCollection.get();
        const games = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(games);
    } catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).json({ error: "Failed to fetch games." });
    }
});

// NEW: Secure Login Route
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password.' });
    }
});

// Admin API to create a new game
app.post('/api/admin/games', requireAuth(ADMIN_PASSWORD), async (req, res) => {
    try {
        const { name, bonus, withdraw, imageUrl, downloadUrl, type } = req.body;
        const newGame = { name, bonus, withdraw, imageUrl, downloadUrl, type };
        await gamesCollection.add(newGame);
        res.status(201).json({ message: 'Game added successfully!' });
    } catch (error) {
        console.error("Error adding game:", error);
        res.status(500).json({ error: 'Failed to add game.' });
    }
});

// Admin API to update a game
app.put('/api/admin/games/:id', requireAuth(ADMIN_PASSWORD), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, bonus, withdraw, imageUrl, downloadUrl, type } = req.body;
        const gameRef = gamesCollection.doc(id);
        const updatedGame = { name, bonus, withdraw, imageUrl, downloadUrl, type };
        await gameRef.update(updatedGame);
        res.json({ message: 'Game updated successfully!' });
    } catch (error) {
        console.error("Error updating game:", error);
        res.status(500).json({ error: 'Failed to update game.' });
    }
});

// Admin API to delete a game
app.delete('/api/admin/games/:id', requireAuth(ADMIN_PASSWORD), async (req, res) => {
    try {
        const { id } = req.params;
        const gameRef = gamesCollection.doc(id);
        await gameRef.delete();
        res.json({ message: 'Game deleted successfully!' });
    } catch (error) {
        console.error("Error deleting game:", error);
        res.status(500).json({ error: 'Failed to delete game.' });
    }
});

// Serve the admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
