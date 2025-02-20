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
    password: 'Hacker$1995', // O'zingizning MySQL parolingizni kiriting
    database: 'loyihalar'
});

db.connect(err => {
    if (err) {
        console.error('MySQLga ulanishda xatolik: ' + err.message);
        return;
    }
    console.log('MySQLga muvaffaqiyatli ulandi!');
});

// Yangi loyihani bazaga qo'shish
app.post('/api/projects', (req, res) => {
    const { name, description, start_date, end_date, status, responsible } = req.body;

    const sql = 'INSERT INTO projects (name, description, start_date, end_date, status, responsible) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, description, start_date, end_date, status, responsible], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Loyiha qo‘shishda xatolik yuz berdi' });
        }
        res.status(201).json({ message: 'Loyiha muvaffaqiyatli qo‘shildi!' });
    });
});

// Serverni ishga tushirish
app.listen(5000, () => {
    console.log('Server 5000-portda ishga tushdi');
});