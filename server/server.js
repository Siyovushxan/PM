const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // JSON ma'lumotlarni o‘qish uchun

// ** MySQL bilan bog‘lanish **
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hacker$1995', // O'zingizning MySQL parolingizni kiriting
    database: 'pm_navoiyuran'
});

db.connect(err => {
    if (err) {
        console.error('MySQLga ulanishda xatolik: ' + err.message);
        return;
    }
    console.log('✅ MySQLga muvaffaqiyatli ulandi!');
});

// ** Yangi loyihani bazaga qo'shish API **
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

// ** Serverni ishga tushirish **
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server ${PORT} portda ishlamoqda...`);
});

// ** Barcha loyihalarni bazadan olish API **
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


// ** Loyihani tahrirlash API **
app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    db.query('SELECT * FROM projects WHERE id = ?', [projectId], (err, result) => {
        if (err) {
            res.status(500).json({ error: "Database error" });
        } else if (result.length === 0) {
            res.status(404).json({ error: "Project not found" });
        } else {
            res.json(result[0]);
        }
    });
});


