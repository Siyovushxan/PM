const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // JSON ma'lumotlarni o‘qish uchun

// MySQL bilan bog‘lanish
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hacker$1995',
    database: 'pm_navoiyuran'
});

db.connect(err => {
    if (err) {
        console.error('MySQLga ulanishda xatolik: ' + err.message);
        return;
    }
    console.log('✅ MySQLga muvaffaqiyatli ulandi!');
});

// Yangi loyihani qo‘shish API
app.post('/api/projects', (req, res) => {
    const { name, description, startDate, endDate, status, responsible } = req.body;

    if (!name || !description || !startDate || !endDate || !status || !responsible) {
        return res.status(400).json({ message: "Barcha maydonlarni to‘ldiring!" });
    }

    const sql = 'INSERT INTO projects (name, description, startDate, endDate, status, responsible) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, description, startDate, endDate, status, responsible], (err, result) => {
        if (err) {
            console.error("MySQL xatolik:", err);
            return res.status(500).json({ message: 'Loyiha qo‘shishda xatolik yuz berdi' });
        }
        res.status(201).json({ message: 'Loyiha muvaffaqiyatli qo‘shildi!' });
    });
});

// Barcha loyihalarni olish API
app.get('/api/projects', (req, res) => {
    const sql = 'SELECT * FROM projects';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Xatolik:", err);
            return res.status(500).json({ message: "Loyihalarni yuklab bo'lmadi" });
        }
        res.json(results);
    });
});

// Bitta loyihani olish API
app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const sql = `SELECT * FROM projects WHERE id = ?`;
    db.query(sql, [projectId], (err, result) => {
        if (err) {
            console.error("Xatolik:", err);
            return res.status(500).json({ message: "Loyihani yuklab bo'lmadi" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Loyiha topilmadi" });
        }
        res.json(result[0]);
    });
});

// Loyihani yangilash API
app.put('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const { name, description, startDate, endDate, status, responsible } = req.body;

    const sql = 'UPDATE projects SET name = ?, description = ?, startDate = ?, endDate = ?, status = ?, responsible = ? WHERE id = ?';
    db.query(sql, [name, description, startDate, endDate, status, responsible, projectId], (err, result) => {
        if (err) {
            console.error("Xatolik:", err);
            return res.status(500).json({ message: "Loyihani yangilashda xatolik" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Loyiha topilmadi" });
        }
        res.json({ message: "Loyiha muvaffaqiyatli yangilandi" });
    });
});

// Loyihani o‘chirish API
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;

    const sql = 'DELETE FROM projects WHERE id = ?';
    db.query(sql, [projectId], (err, result) => {
        if (err) {
            console.error("Xatolik:", err);
            return res.status(500).json({ message: "Loyihani o‘chirishda xatolik" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Loyiha topilmadi" });
        }
        res.json({ message: "Loyiha muvaffaqiyatli o‘chirildi" });
    });
});

// Serverni ishga tushirish
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server ${PORT} portda ishlamoqda...`);
});