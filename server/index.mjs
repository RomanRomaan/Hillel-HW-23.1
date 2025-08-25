// server/index.mjs
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// ---- статические файлы (index.html, script.js, main.css) из корня проекта ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..')));

// ===================== MongoDB Atlas =====================

const atlasUri =
    'mongodb+srv://romanfindjob:Nbqb7kGbUguMc3vq@cluster0.kcctlew.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0';

// Если в ENV задано — используем его, иначе atlasUri сверху
const mongoUrl = process.env.MONGODB_URI || atlasUri;

// Логируем, что именно берем (без пароля)
try {
    const u = new URL(mongoUrl);
    console.log('Using URI → host:', u.host, 'db:', u.pathname || '/');
} catch (e) {
    console.warn('Could not parse mongo URI for log:', e?.message);
}

// Подключение. Явно укажем имя БД через dbName (на случай, если в URI его нет/меняют).
await mongoose.connect(mongoUrl, { dbName: 'mydatabaseQunik' });

// Логи успешного коннекта + имя БД из драйвера
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
    } catch (e) { next(e); }
});

// Create
app.post('/api/todos', async (req, res, next) => {
    try {
        const { title, isDone } = req.body || {};
        if (!title) return res.status(400).json({ error: 'title is required' });
        const created = await Todo.create({ title, isDone });
        res.status(201).json(created);
    } catch (e) { next(e); }
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
    } catch (e) { next(e); }
});

// Delete
app.delete('/api/todos/:id', async (req, res, next) => {
    try {
        const deleted = await Todo.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('ERR:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err?.message || 'Server error' });
});

// Старт сервера
const PORT = process.env.PORT || 5555;
app.listen(PORT, () => console.log(`Server started at ${PORT}`));
