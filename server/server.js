const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const bcrypt = require('bcrypt')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const session = require('express-session')
const app = express();

// CORS sozlamalari
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501', 'http://localhost:5501', 'http://localhost', 'https://pm-navoiyuran.vercel.app'],
    credentials: true, // Cookie’larni uzatish uchun
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

// Sessiya sozlamalari
app.use(session({
    secret: 'mysecretkey123456', // Maxfiy va noyob kalit
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Mahalliy muhitda false
        httpOnly: true,
        sameSite: 'lax', // 'none' dan 'lax' ga qaytarildi
        maxAge: 24 * 60 * 60 * 1000 // 24 soat
    }
}));

app.use(express.json());

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const fileName = Date.now() + '-' + file.originalname;
        console.log('Saqlanayotgan fayl nomi:', fileName);
        cb(null, fileName);
    },
});
const upload = multer({ storage: storage });

// Statik fayllarni xizmat qilish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.static(path.join(__dirname, '../')));

// MySQL bilan bog'lanish
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hacker$1995', // Maxfiylashtirish uchun .env ishlatish tavsiya qilinadi
    database: 'pm_navoiyuran',
})

db.connect(err => {
    if (err) {
        console.error('MySQLga ulanishda xatolik: ' + err.message)
        return
    }
    console.log('✅ MySQLga muvaffaqiyatli ulandi!')
})

// Static fayllarni xizmat qilish (to'g'ri yo'nalish)
const publicPath = path.join(__dirname, '..') // Server papkasidan bir yuqoriga chiqish
app.use(express.static(publicPath))

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Sessiyani tekshirish endpointi
app.get('/api/check-session', (req, res) => {
    console.log('Sessiyani tekshirish so‘rovi keldi:', req.session); // Debugging uchun
    if (req.session.userId) {
        res.json({ userId: req.session.userId });
    } else {
        res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' });
    }
});

// Loyihaga tegishli barcha vazifalarni olish API
app.get('/api/vazifalar', (req, res) => {
    const projectId = req.query.project_id;

    if (!projectId) {
        return res.status(400).json({ message: 'project_id majburiy parametr!' });
    }

    const sql = 'SELECT * FROM vazifalar WHERE project_id = ?';
    db.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error('Xatolik:', err);
            return res.status(500).json({ message: "Vazifalarni yuklab bo'lmadi" });
        }

        // Bazadan olingan vazifa_status qiymatlarini kichik harfga aylantiramiz
        const normalizedResults = results.map(task => ({
            ...task,
            vazifa_status: task.vazifa_status ? task.vazifa_status.toLowerCase() : ''
        }));

        res.json(normalizedResults);
    });
});

// Barcha vazifalarni olish API
app.get('/api/all-vazifalar', (req, res) => {
    const sql = 'SELECT * FROM vazifalar';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Xatolik:', err);
            return res.status(500).json({ message: "Vazifalarni yuklab bo'lmadi" });
        }

        // Bazadan olingan vazifa_status qiymatlarini kichik harfga aylantiramiz
        const normalizedResults = results.map(task => ({
            ...task,
            vazifa_status: task.vazifa_status ? task.vazifa_status.toLowerCase() : ''
        }));

        res.json(normalizedResults);
    });
});

// Yangi vazifa qo‘shish API
app.post('/api/vazifalar', (req, res) => {
    const {
        project_id,
        vazifa_nomi,
        izoh,
        vazifa_boshlanish_sanasi,
        vazifa_tugash_sanasi,
        vazifa_status,
        vazifa_masul_hodimi,
    } = req.body
    if (
        !project_id ||
        !vazifa_nomi ||
        !vazifa_boshlanish_sanasi ||
        !vazifa_tugash_sanasi ||
        !vazifa_status ||
        !vazifa_masul_hodimi
    ) {
        return res
            .status(400)
            .json({ message: 'Barcha majburiy maydonlarni to‘ldiring!' })
    }
    // vazifa_status ni kichik harfga aylantiramiz
    const normalizedStatus = vazifa_status.toLowerCase();
    const sql =
        'INSERT INTO vazifalar (project_id, vazifa_nomi, izoh, vazifa_boshlanish_sanasi, vazifa_tugash_sanasi, vazifa_status, vazifa_masul_hodimi) VALUES (?, ?, ?, ?, ?, ?, ?)'
    db.query(
        sql,
        [
            project_id,
            vazifa_nomi,
            izoh,
            vazifa_boshlanish_sanasi,
            vazifa_tugash_sanasi,
            normalizedStatus,
            vazifa_masul_hodimi,
        ],
        (err, result) => {
            if (err) {
                console.error('MySQL xatolik:', err)
                return res
                    .status(500)
                    .json({ message: 'Vazifa qo‘shishda xatolik yuz berdi' })
            }
            res.status(201).json({ message: 'Vazifa muvaffaqiyatli qo‘shildi!' })
        }
    )
})

// Vazifa detallarini olish (modal uchun)
app.get('/api/vazifalar/:taskId', (req, res) => {
    const taskId = req.params.taskId
    const sql =
        'SELECT id, vazifa_nomi AS name, izoh AS description FROM vazifalar WHERE id = ?'
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error('Xatolik:', err)
            return res
                .status(500)
                .json({ message: "Vazifa ma’lumotlari yuklab bo'lmadi" })
        }
        if (results.length > 0) {
            res.json(results[0])
        } else {
            res.status(404).json({ message: 'Vazifa topilmadi' })
        }
    })
})

// O‘ng tomon detallarini olish (modal uchun)
app.get('/api/vazifalar-details-right/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const sql = 'SELECT vazifa_masul_hodimi AS responsible, vazifa_boshlanish_sanasi AS start_date, vazifa_tugash_sanasi AS end_date, vazifa_status AS status FROM vazifalar WHERE id = ?';
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error('Xatolik:', err);
            return res.status(500).json({ message: "Detallar yuklab bo'lmadi" });
        }
        if (results.length > 0) {
            const normalizedResult = {
                ...results[0],
                status: results[0].status ? results[0].status.toLowerCase() : ''
            };
            res.json(normalizedResult);
        } else {
            res.status(404).json({ message: 'Vazifa topilmadi' });
        }
    });
});

// Mavjud loyiha va boshqa endpointlar
app.post('/api/projects', (req, res) => {
    const { name, description, startDate, endDate, status, responsible } =
        req.body
    if (
        !name ||
        !description ||
        !startDate ||
        !endDate ||
        !status ||
        !responsible
    ) {
        return res.status(400).json({ message: 'Barcha maydonlarni to‘ldiring!' })
    }
    const sql =
        'INSERT INTO projects (name, description, startDate, endDate, status, responsible) VALUES (?, ?, ?, ?, ?, ?)'
    db.query(
        sql,
        [name, description, startDate, endDate, status, responsible],
        (err, result) => {
            if (err) {
                console.error('MySQL xatolik:', err)
                return res
                    .status(500)
                    .json({ message: 'Loyiha qo‘shishda xatolik yuz berdi' })
            }
            res.status(201).json({ message: 'Loyiha muvaffaqiyatli qo‘shildi!' })
        }
    )
})

app.get('/api/projects', (req, res) => {
    const sql = 'SELECT * FROM projects ORDER BY id ASC'
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Xatolik:', err)
            return res.status(500).json({ message: "Loyihalarni yuklab bo'lmadi" })
        }
        res.json(results)
    })
})

// Loyihalar statistikasi uchun endpoint (projects jadvalidan ma'lumotlarni olish)
app.get('/api/loyihalar', (req, res) => {
    const sql = 'SELECT * FROM projects';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Xatolik:', err);
            return res.status(500).json({ message: "Loyihalarni yuklab bo'lmadi" });
        }

        // Bazadan olingan status qiymatlarini kichik harfga aylantiramiz
        const normalizedResults = results.map(project => ({
            ...project,
            status: project.status ? project.status.toLowerCase() : ''
        }));

        res.json(normalizedResults);
    });
});

app.get('/api/projects/:id', (req, res) => {
    const projectId = req.params.id
    const sql = 'SELECT * FROM projects WHERE id = ?'
    db.query(sql, [projectId], (err, result) => {
        if (err) {
            console.error('Xatolik:', err)
            return res.status(500).json({ message: "Loyihani yuklab bo'lmadi" })
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'Loyiha topilmadi' })
        }
        res.json(result[0])
    })
})

app.put('/api/projects/:id', (req, res) => {
    const projectId = req.params.id
    const { name, description, startDate, endDate, status, responsible } =
        req.body
    const sql =
        'UPDATE projects SET name = ?, description = ?, startDate = ?, endDate = ?, status = ?, responsible = ? WHERE id = ?'
    db.query(
        sql,
        [name, description, startDate, endDate, status, responsible, projectId],
        (err, result) => {
            if (err) {
                console.error('Xatolik:', err)
                return res.status(500).json({ message: 'Loyihani yangilashda xatolik' })
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Loyiha topilmadi' })
            }
            res.json({ message: 'Loyiha muvaffaqiyatli yangilandi' })
        }
    )
})

// Loyiha o'chirish
app.delete('/api/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const sql = 'DELETE FROM projects WHERE id = ?';
    db.query(sql, [projectId], (err, result) => {
        if (err) {
            console.error('Loyihani o‘chirishda xatolik:', err.message);
            return res.status(500).json({ message: 'Server xatosi' });
        }
        res.json({ message: 'Loyiha muvaffaqiyatli o‘chirildi!' });
    });
});

app.put('/api/vazifalar/:id', (req, res) => {
    const taskId = req.params.id
    const {
        vazifa_nomi,
        izoh,
        vazifa_boshlanish_sanasi,
        vazifa_tugash_sanasi,
        vazifa_status,
        vazifa_masul_hodimi,
    } = req.body
    // vazifa_status ni kichik harfga aylantiramiz
    const normalizedStatus = vazifa_status ? vazifa_status.toLowerCase() : '';
    const sql =
        'UPDATE vazifalar SET vazifa_nomi = ?, izoh = ?, vazifa_boshlanish_sanasi = ?, vazifa_tugash_sanasi = ?, vazifa_status = ?, vazifa_masul_hodimi = ? WHERE id = ?'
    db.query(
        sql,
        [
            vazifa_nomi,
            izoh,
            vazifa_boshlanish_sanasi,
            vazifa_tugash_sanasi,
            normalizedStatus,
            vazifa_masul_hodimi,
            taskId,
        ],
        (err, result) => {
            if (err) {
                console.error('Xatolik:', err)
                return res.status(500).json({ message: 'Vazifa yangilanishda xatolik' })
            }
            res.json({ message: 'Vazifa muvaffaqiyatli yangilandi' })
        }
    )
})

// Login endpointi
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Login va parol majburiy!' });
    }
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('MySQL xatolik:', err.message);
            return res.status(500).json({ message: 'Server xatosi' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri!' });
        }
        const user = results[0];
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.userId = user.id.toString(); // Sessiyaga saqlash
                req.session.save((err) => {
                    if (err) {
                        console.error('Sessiya saqlashda xatolik:', err);
                        return res.status(500).json({ message: 'Sessiya saqlashda xatolik' });
                    }
                    console.log('Sessiya saqlandi:', req.session); // Debugging uchun
                    res.json({
                        message: 'Tizimga muvaffaqiyatli kirdingiz!',
                        userId: user.id.toString(),
                    });
                });
            } else {
                return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri!' });
            }
        } catch (bcryptError) {
            console.error('Parol tekshirishda xatolik:', bcryptError.message);
            return res.status(500).json({ message: 'Server xatosi' });
        }
    });
});

// Foydalanuvchi ma'lumotlarini olish
app.get('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT FISH, Bulim, Lavozim FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', err.message);
            return res.status(500).json({ message: 'Server xatosi' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
        }
        res.json(results[0]);
    });
});

// Barcha foydalanuvchilarni olish (parent_bulim qo‘shildi)
app.get('/api/users', (req, res) => {
    const sql = 'SELECT id, username, created_at, fish, bulim, parent_bulim, lavozim, role FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Foydalanuvchilarni olishda xatolik:', err);
            return res.status(500).json({ message: 'Foydalanuvchilarni yuklashda xatolik yuz berdi.' });
        }
        res.json(results);
    });
});

// Barcha bo‘limlarni olish (Bulim va parent_bulim birgalikda)
app.get('/api/bulims', (req, res) => {
    const query = 'SELECT DISTINCT Bulim, parent_bulim FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Bo‘limlarni olishda xatolik', error: err.message });
        }
        // Faqat Bulim va parent_bulim qiymatlarini olish
        const bulims = new Set();
        results.forEach(row => {
            if (row.Bulim) bulims.add(row.Bulim);
            if (row.parent_bulim) bulims.add(row.parent_bulim);
        });
        res.json(Array.from(bulims).map(bulim => ({ Bulim: bulim })));
    });
});

// Username mavjudligini tekshirish endpointi
app.get('/api/check-username', (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ message: 'Username parametri majburiy!' });
    }

    const sql = 'SELECT id FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Username tekshirishda xatolik:', err);
            return res.status(500).json({ message: 'Server xatosi', error: err.message });
        }

        if (results.length > 0) {
            return res.json({ exists: true, message: 'Bu login allaqachon mavjud!' });
        } else {
            return res.json({ exists: false, message: 'Bu login mavjud emas.' });
        }
    });
});

// Foydalanuvchilarni tahrirlash, o‘chirish va parolni tiklash funksiyalarini qo‘shish
// Foydalanuvchilarni tahrirlash (parent_bulim qo‘shildi)
app.put('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    const requesterId = req.session.userId;
    if (!requesterId) {
        return res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' });
    }

    const sqlCheckRole = 'SELECT role FROM users WHERE id = ?';
    db.query(sqlCheckRole, [requesterId], (err, results) => {
        if (err || results.length === 0 || results[0].role !== 'admin') {
            return res.status(403).json({ message: 'Sizda bu amalni bajarish uchun ruxsat yo‘q' });
        }

        const { fish, bulim, parent_bulim, lavozim, login, role } = req.body;
        if (!fish || !bulim || !lavozim || !login || !role) {
            return res.status(400).json({ message: 'Barcha maydonlarni to‘ldiring!' });
        }

        const sql = `
            UPDATE users 
            SET fish = ?, bulim = ?, parent_bulim = ?, lavozim = ?, username = ?, role = ?
            WHERE id = ?
        `;
        const values = [fish, bulim, parent_bulim || null, lavozim, login, role, userId];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Foydalanuvchi ma\'lumotlarini yangilashda xatolik:', err);
                return res.status(500).json({ message: 'Foydalanuvchi ma\'lumotlarini yangilashda xatolik yuz berdi.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' });
            }
            res.json({ message: 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi!' });
        });
    });
});

// Foydalanuvchi parolini tiklash endpointi
app.put('/api/users/:id/reset-password', async (req, res) => {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: 'Yangi parol majburiy!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = 'UPDATE users SET password = ? WHERE id = ?';
        db.query(sql, [hashedPassword, userId], (err, result) => {
            if (err) {
                console.error('Parolni tiklashda xatolik:', err);
                return res.status(500).json({ message: 'Parolni tiklashda xatolik yuz berdi.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' });
            }
            res.json({ message: 'Parol muvaffaqiyatli tiklandi!' });
        });
    } catch (error) {
        console.error('Serverda xatolik:', error);
        res.status(500).json({ message: 'Serverda xatolik yuz berdi.', error: error.message });
    }
});

// Foydalanuvchini o‘chirish endpointi
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Foydalanuvchini o‘chirishda xatolik:', err);
            return res.status(500).json({ message: 'Foydalanuvchini o‘chirishda xatolik yuz berdi.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' });
        }
        res.json({ message: 'Foydalanuvchi muvaffaqiyatli o‘chirildi!' });
    });
});

// Chat tarixini olish
app.get('/api/chat-history/:taskId', (req, res) => {
    const taskId = req.params.taskId
    const sql =
        'SELECT ch.user_task_id, ch.task_id, u.fish, ch.matn, ch.vaqt, ch.file_paths, ch.is_result FROM chat_history ch LEFT JOIN users u ON ch.user_task_id = u.id WHERE ch.task_id = ? ORDER BY ch.vaqt ASC'
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error('Chat tarixi olishda xatolik:', err)
            return res
                .status(500)
                .json({ message: 'Chat tarixi yuklanmadi', error: err.message })
        }
        console.log('Chat tarixi javobi:', results)
        results.forEach(result => {
            if (!result.fish)
                console.warn('Fish topilmadi, user_task_id:', result.user_task_id)
        })
        res.json(results || [])
    })
})

// Chat tarixiga xabar qo‘shish
app.post('/api/chat-history', upload.array('file_paths', 5), (req, res) => {
    const { task_id, user_task_id, fish, matn, is_result = 0 } = req.body
    const vaqt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const filePaths = req.files
        ? req.files.map(file => file.filename).join(',')
        : ''

    console.log("Kiritilgan ma'lumotlar (Server):", {
        task_id,
        user_task_id,
        fish,
        matn,
        is_result,
        filePaths,
        files: req.files ? req.files.map(f => f.originalname) : 'None',
    })

    if (!task_id || !user_task_id || !fish) {
        return res
            .status(400)
            .json({ message: 'task_id, user_task_id va fish majburiy!' })
    }

    const parsedTaskId = parseInt(task_id)
    if (isNaN(parsedTaskId)) {
        console.error('task_id noto‘g‘ri formatda:', task_id)
        return res.status(400).json({ message: 'task_id son bo‘lishi kerak!' })
    }

    const parsedUserTaskId = parseInt(user_task_id)
    if (isNaN(parsedUserTaskId)) {
        console.error('user_task_id noto‘g‘ri formatda:', user_task_id)
        return res.status(400).json({ message: 'user_task_id son bo‘lishi kerak!' })
    }

    db.query(
        'SELECT id FROM vazifalar WHERE id = ?',
        [parsedTaskId],
        (err, results) => {
            if (err) {
                console.error('Vazifa tekshirishda xatolik:', err)
                return res
                    .status(500)
                    .json({ message: 'Server xatosi', error: err.message })
            }
            if (results.length === 0) {
                console.error('Vazifa topilmadi:', parsedTaskId)
                return res
                    .status(404)
                    .json({ message: 'Belgilangan vazifa topilmadi!' })
            }

            db.query(
                'SELECT id FROM users WHERE id = ?',
                [parsedUserTaskId],
                (err, userResults) => {
                    if (err) {
                        console.error('Foydalanuvchi tekshirishda xatolik:', err)
                        return res
                            .status(500)
                            .json({ message: 'Server xatosi', error: err.message })
                    }
                    if (userResults.length === 0) {
                        console.error('Foydalanuvchi topilmadi:', parsedUserTaskId)
                        return res
                            .status(404)
                            .json({ message: 'Belgilangan foydalanuvchi topilmadi!' })
                    }

                    const sql =
                        'INSERT INTO chat_history (task_id, user_task_id, fish, matn, vaqt, file_paths, is_result) VALUES (?, ?, ?, ?, ?, ?, ?)'
                    db.query(
                        sql,
                        [
                            parsedTaskId,
                            parsedUserTaskId,
                            fish,
                            matn || '',
                            vaqt,
                            filePaths,
                            is_result,
                        ],
                        (err, result) => {
                            if (err) {
                                console.error(
                                    'Xabar saqlashda xatolik:',
                                    err.sqlMessage || err.message
                                )
                                return res.status(500).json({
                                    message: 'Xabar saqlanmadi',
                                    error: err.sqlMessage || err.message,
                                })
                            }
                            console.log('Xabar muvaffaqiyatli saqlandi:', result)
                            res
                                .status(201)
                                .json({ message: 'Xabar muvaffaqiyatli yuborildi' })
                        }
                    )
                }
            )
        }
    )
})

// Vazifa statusini yangilash (yangi endpoint)
app.post('/api/update-task-status', (req, res) => {
    const { taskId } = req.body
    if (!taskId) {
        return res.status(400).json({ message: 'Task ID is required' })
    }

    const query = 'UPDATE vazifalar SET vazifa_status = ? WHERE id = ?'
    db.query(query, ['Yakunlandi', taskId], (err, result) => {
        if (err) {
            console.error('Vazifa statusini yangilashda xatolik:', err)
            return res.status(500).json({ message: 'Server xatosi' })
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Vazifa topilmadi' })
        }
        res.json({ message: 'Vazifa statusi muvaffaqiyatli yangilandi' })
    })
})

// Rolga asoslangan ruxsatni tekshirish (userId ni so‘rov parametri sifatida qabul qilamiz)
app.get('/api/check-permission', (req, res) => {
    const userId = req.query.userId; // userId ni so‘rov parametridan olamiz
    console.log('Check-permission userId:', userId);

    if (!userId) {
        return res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan', authorized: false });
    }

    const sql = 'SELECT role FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("Ruxsatni tekshirishda xatolik:", err.message);
            return res.status(500).json({ message: 'Server xatosi', authorized: false });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Foydalanuvchi topilmadi', authorized: false });
        }
        const role = results[0].role || 'user';
        const authorized = role === 'admin';
        res.json({ authorized, role });
    });
});

// Loyiha bo'yicha vazifalarni olish
app.get('/api/vazifalar/:project_id', (req, res) => {
    const projectId = parseInt(req.params.project_id);
    if (isNaN(projectId)) {
        console.error(`Noto‘g‘ri loyiha ID: ${req.params.project_id}`);
        return res.status(400).json({ message: 'Noto‘g‘ri loyiha ID' });
    }

    console.log(`Vazifalarni olish uchun so‘rov: project_id = ${projectId}`);
    const sql = 'SELECT * FROM vazifalar WHERE project_id = ?';
    db.query(sql, [projectId], (err, results) => {
        if (err) {
            console.error('Vazifalarni olishda xatolik:', err.message);
            return res.status(500).json({ message: 'Server xatosi' });
        }
        console.log(`Loyiha ID: ${projectId} uchun topilgan vazifalar:`, results);
        res.json(results.length > 0 ? results : []); // Bo‘sh array qaytarish
    });
});

// Yangi foydalanuvchi qo‘shish endpointi
app.post('/api/users', async (req, res) => {
    console.log('POST /api/users so‘rovi keldi:', req.body);

    const { fish, bulim, parent_bulim, lavozim, login, password, role, created_at } = req.body;

    if (!fish || !bulim || !lavozim || !login || !password || !role) {
        console.log('Xato: Barcha maydonlar to‘ldirilmagan');
        return res.status(400).json({ message: 'Barcha maydonlarni to‘ldiring!' });
    }

    // Username mavjudligini tekshirish
    const checkUsernameSql = 'SELECT id FROM users WHERE username = ?';
    db.query(checkUsernameSql, [login], async (err, results) => {
        if (err) {
            console.error('Username tekshirishda xatolik:', err);
            return res.status(500).json({ message: 'Server xatosi', error: err.message });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Bu login allaqachon mavjud!' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const formattedCreatedAt = created_at
                ? new Date(created_at).toISOString().slice(0, 19).replace('T', ' ')
                : new Date().toISOString().slice(0, 19).replace('T', ' ');

            const query = `
                INSERT INTO users (FISH, Bulim, parent_bulim, Lavozim, username, password, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [fish, bulim, parent_bulim || null, lavozim, login, hashedPassword, role, formattedCreatedAt];

            console.log('SQL so‘rov yuborilmoqda:', query, values);
            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('SQL so‘rovda xatolik:', err);
                    return res.status(500).json({ message: 'Foydalanuvchi qo‘shishda xatolik yuz berdi.', error: err.message });
                }
                console.log('Foydalanuvchi muvaffaqiyatli qo‘shildi:', result);
                res.status(201).json({ message: 'Foydalanuvchi muvaffaqiyatli qo‘shildi!' });
            });
        } catch (error) {
            console.error('Serverda xatolik:', error);
            res.status(500).json({ message: 'Serverda xatolik yuz berdi.', error: error.message });
        }
    });
});

// Barcha bo‘limlarni olish
app.get('/api/bulims', (req, res) => {
    const query = 'SELECT DISTINCT Bulim FROM users';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Bo‘limlarni olishda xatolik', error: err.message });
        }
        res.json(results);
    });
});

const PORT = 5000
app.listen(PORT, () => {
    console.log(`✅ Server ${PORT} portda ishlamoqda...`)
})

function formatDateToMySQL(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ')
}

function calculateDaysDiff(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}