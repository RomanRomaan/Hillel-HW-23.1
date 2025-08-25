// server/index.mjs
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// ---------- middleware ----------
app.use(cors());                // при желании сузить до GitHub Pages
app.use(express.json());

// ---------- static: раздаём папку client ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'client')));

// ===================== MongoDB Atlas =====================
// Можно вынести в ENV: MONGODB_URI="mongodb+srv://.../mydatabase?..."
const atlasUri =
    'mongodb+srv://romanfindjob:Nbqb7kGbUguMc3vq@cluster0.kcctlew.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0';

const mongoUrl = process.env.MONGODB_URI || atlasUri;

// лог: покажем, к какому хосту/БД будем коннектиться (без пароля)
try {
    const u = new URL(mongoUrl);
    console.log('Using URI → host:', u.host, 'db:', u.pathname || '/');
} catch (e) {
    console.warn('Could not parse mongo URI for log:', e?.message);
}

// коннектимся (имя БД берём из URI: /mydatabase)
await mongoose.connect(mongoUrl);

mongoose.connection.once('open', () => {
    const dbName = mongoose.connection.db?.databaseName;
    console.log('✅ Connected to MongoDB');
    console.log('   Driver DB name:', dbName);
});
mongoose.connection.on('error', err => console.error('❌ Mongo error:', err));

// ===================== Модель Todo =====================
const { Schema, model } = mongoose;
const todoSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        isDone: { type: Boolean, default: false }
    },
    { timestamps: true }
);
const Todo = model('Todo', todoSchema);

// ===================== CRUD API =====================

// Read all
app.get('/api/todos', async (req, res, next) => {
    try {
        const items = await Todo.find().sort({ createdAt: -1 }).lean();
        res.json(items);
    } catch (err) { next(err); }
});

// Create
app.post('/api/todos', async (req, res, next) => {
    try {
        const { title, isDone } = req.body || {};
        if (!title) return res.status(400).json({ error: 'title is required' });
        const created = await Todo.create({ title, isDone });
        res.status(201).json(created);
    } catch (err) { next(err); }
});

// Update
app.put('/api/todos/:id', async (req, res, next) => {
    try {
        const updated = await Todo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (err) { next(err); }
});

// Delete
app.delete('/api/todos/:id', async (req, res, next) => {
    try {
        const deleted = await Todo.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (err) { next(err); }
});

// Диагностика: куда подключены и сколько документов
app.get('/api/where', async (req, res) => {
    const info = {
        readyState: mongoose.connection.readyState,             // 1 = connected
        dbName: mongoose.connection.db?.databaseName || null,
        uriHost: (() => { try { return new URL(mongoUrl).host; } catch { return null; } })(),
        count: await Todo.countDocuments()
    };
    res.json(info);
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('ERR:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err?.message || 'Server error' });
});

// ---------- start ----------
const PORT = process.env.PORT || 5555;
app.listen(PORT, () => console.log(`Server started at ${PORT}`));
