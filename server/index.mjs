import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// Раздаём фронт из корня проекта (index.html, script.js, main.css)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..')));

// ===== MongoDB Atlas =====
// РЕКОМЕНДОВАНО: хранить строку в переменной окружения MONGODB_URI
const mongoUrl =
    process.env.MONGODB_URI ||
    'mongodb+srv://romanfindjob:Nbqb7kGbUguMc3vq@cluster0.kcctlew.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoUrl);
mongoose.connection.on('open', () => console.log('Mongo DB is connected'));
mongoose.connection.on('error', err => console.log('Mongo DB is failed', err));

// ===== Модель Todo =====
const { Schema, model } = mongoose;
const todoSchema = new Schema({
    title: { type: String, required: true },
    isDone: { type: Boolean, default: false }
});
const Todo = model('Todo', todoSchema);

// ===== CRUD =====
app.get('/api/todos', async (req, res, next) => {
    try { res.json(await Todo.find().lean()); } catch (e) { next(e); }
});

app.post('/api/todos', async (req, res, next) => {
    try { res.status(201).json(await Todo.create(req.body)); } catch (e) { next(e); }
});

app.put('/api/todos/:id', async (req, res, next) => {
    try {
        const doc = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
    } catch (e) { next(e); }
});

app.delete('/api/todos/:id', async (req, res, next) => {
    try {
        const doc = await Todo.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('ERR:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(5555, () => console.log('Server started at 5555'));
