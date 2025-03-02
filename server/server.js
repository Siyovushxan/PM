const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const bcrypt = require('bcrypt')
const path = require('path') // Statik fayllar uchun kerak
const multer = require('multer')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = './uploads'
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}
		cb(null, dir)
	},
	filename: (req, file, cb) => {
		const fileName = Date.now() + '-' + file.originalname
		console.log('Saqlanayotgan fayl nomi:', fileName) // Debugging
		cb(null, fileName)
	},
})
const upload = multer({ storage: storage })

// Statik fayllarni xizmat qilish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Statik fayllarni xizmat qilish (yuklangan fayllar uchun)
app.use(express.static(path.join(__dirname, 'uploads')))
app.use(express.static(path.join(__dirname)))

// MySQL bilan bog‘lanish
const db = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'Hacker$1995',
	database: 'pm_navoiyuran',
})

db.connect(err => {
	if (err) {
		console.error('MySQLga ulanishda xatolik: ' + err.message)
		return
	}
	console.log('✅ MySQLga muvaffaqiyatli ulandi!')
})

// Loyihaga tegishli barcha vazifalarni olish API
app.get('/api/vazifalar', (req, res) => {
	const projectId = req.query.project_id
	if (!projectId) {
		return res.status(400).json({ message: 'project_id majburiy parametr!' })
	}

	const sql = 'SELECT * FROM vazifalar WHERE project_id = ?'
	db.query(sql, [projectId], (err, results) => {
		if (err) {
			console.error('Xatolik:', err)
			return res.status(500).json({ message: "Vazifalarni yuklab bo'lmadi" })
		}
		res.json(results)
	})
})

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
			vazifa_status,
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

// Mavjud loyiha va vazifa endpointlari (oldingi kodni saqlab qoldim)
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

app.get('/api/projects/:id', (req, res) => {
	const projectId = req.params.id
	const sql = `SELECT * FROM projects WHERE id = ?`
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

app.delete('/api/projects/:id', (req, res) => {
	const projectId = req.params.id
	const sql = 'DELETE FROM projects WHERE id = ?'
	db.query(sql, [projectId], (err, result) => {
		if (err) {
			console.error('Xatolik:', err)
			return res.status(500).json({ message: 'Loyihani o‘chirishda xatolik' })
		}
		if (result.affectedRows === 0) {
			return res.status(404).json({ message: 'Loyiha topilmadi' })
		}
		res.json({ message: 'Loyiha muvaffaqiyatli o‘chirildi' })
	})
})

app.get('/api/vazifalar/:id', (req, res) => {
	const taskId = req.params.id
	const sql = 'SELECT * FROM vazifalar WHERE id = ?'
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
	const sql =
		'UPDATE vazifalar SET vazifa_nomi = ?, izoh = ?, vazifa_boshlanish_sanasi = ?, vazifa_tugash_sanasi = ?, vazifa_status = ?, vazifa_masul_hodimi = ? WHERE id = ?'
	db.query(
		sql,
		[
			vazifa_nomi,
			izoh,
			vazifa_boshlanish_sanasi,
			vazifa_tugash_sanasi,
			vazifa_status,
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
	const { username, password } = req.body

	if (!username || !password) {
		return res.status(400).json({ message: 'Login va parol majburiy!' })
	}

	const sql = 'SELECT * FROM users WHERE username = ?'
	db.query(sql, [username], async (err, results) => {
		if (err) {
			console.error('MySQL xatolik:', err.message)
			return res.status(500).json({ message: 'Server xatosi' })
		}

		if (results.length === 0) {
			return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri!' })
		}

		const user = results[0]
		try {
			const isMatch = await bcrypt.compare(password, user.password)
			if (isMatch) {
				console.log('Muvaffaqiyatli login: ' + user.username)
				return res.json({
					message: 'Tizimga muvaffaqiyatli kirdingiz!',
					userId: user.id,
				})
			} else {
				return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri!' })
			}
		} catch (bcryptError) {
			console.error('Parol tekshirishda xatolik:', bcryptError.message)
			return res.status(500).json({ message: 'Server xatosi' })
		}
	})
})

// Foydalanuvchi ma'lumotlarini olish
app.get('/api/user/:id', (req, res) => {
	const userId = req.params.id

	const sql = 'SELECT FISH, Bulim, Lavozim FROM users WHERE id = ?'
	db.query(sql, [userId], (err, results) => {
		if (err) {
			console.error("Ma'lumot olishda xatolik:", err.message)
			return res.status(500).json({ message: 'Server xatosi' })
		}

		if (results.length === 0) {
			return res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
		}

		const user = results[0]
		res.json({
			FISH: user.FISH,
			Bulim: user.Bulim,
			Lavozim: user.Lavozim,
		})
	})
})

// Chat tarixini olish (users jadvalidan fish ni olish uchun JOIN)
app.get('/api/chat-history/:taskId', (req, res) => {
	const taskId = req.params.taskId
	const sql = `
			SELECT ch.user_task_id, ch.task_id, u.fish, ch.matn, ch.vaqt, ch.file_paths 
			FROM chat_history ch 
			LEFT JOIN users u ON ch.user_task_id = u.id 
			WHERE ch.task_id = ? 
			ORDER BY ch.vaqt ASC
	`
	db.query(sql, [taskId], (err, results) => {
		if (err) {
			console.error('Chat tarixi olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Chat tarixi yuklanmadi', error: err.message })
		}
		console.log('Chat tarixi javobi:', results) // Debugging
		results.forEach(result => {
			if (!result.fish)
				console.warn('Fish topilmadi, user_task_id:', result.user_task_id)
		})
		res.json(results || [])
	})
})

// Vaqtni MySQL formatiga o'zgartirish funksiyasi
function formatDateToMySQL(date) {
    return date.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:mm:ss
}

// Kunlar farqini hisoblash funksiyasi
function calculateDaysDiff(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

app.use(express.json());

// // Chat tarixini olish (users jadvalidan fish ni olish uchun JOIN)
// app.get('/api/chat-history/:taskId', (req, res) => {
//     const taskId = req.params.taskId;
//     const sql = `
//         SELECT ch.user_task_id, ch.task_id, u.fish, ch.matn, ch.vaqt, ch.file_paths, ch.original_file_names 
//         FROM chat_history ch 
//         LEFT JOIN users u ON ch.user_task_id = u.id 
//         WHERE ch.task_id = ? 
//         ORDER BY ch.vaqt DESC
//     `;
//     db.query(sql, [taskId], (err, results) => {
//         if (err) {
//             console.error('Chat tarixi olishda xatolik:', err);
//             return res.status(500).json({ message: 'Chat tarixi yuklanmadi', error: err.message });
//         }
//         console.log('Chat tarixi javobi:', results); // Debugging
//         results.forEach((result) => {
//             if (!result.fish) console.warn('Fish topilmadi, user_task_id:', result.user_task_id);
//             if (result.file_paths) console.log('Fayl yo\'llari:', JSON.parse(result.file_paths)); // Debugging
//             if (result.original_file_names) console.log('Original fayl nomlari:', JSON.parse(result.original_file_names)); // Debugging
//         });
//         res.json(results || []);
//     });
// });

// // Xabar yuborish va saqlash
// app.post('/api/send-message', upload.array('files', 5), (req, res) => {
//     const { task_id, user_task_id, fish, matn, original_file_names } = req.body;
//     const files = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
//     const filePaths = JSON.stringify(files);
//     const originalFileNamesArray = original_file_names ? JSON.parse(original_file_names) : [];
//     const vaqt = formatDateToMySQL(new Date());

//     console.log('Keldi:', { task_id, user_task_id, fish, matn, files, original_file_names: originalFileNamesArray }); // Debugging

//     if (!task_id || !user_task_id) {
//         console.error('Talab qilinmagan maydonlar:', { task_id, user_task_id });
//         return res.status(400).json({ message: 'task_id va user_task_id talab qilinadi' });
//     }

//     // Fish ni tekshirish uchun users jadvalidan olish
//     const checkFishSql = 'SELECT fish FROM users WHERE id = ?';
//     db.query(checkFishSql, [user_task_id], (err, userResult) => {
//         if (err) {
//             console.error('Foydalanuvchi tekshirishda xatolik:', err);
//             return res.status(500).json({ message: 'Foydalanuvchi topilmadi', error: err.message });
//         }
//         const actualFish = userResult.length > 0 ? userResult[0].fish : fish || 'Noma\'lum';

//         const sql = 'INSERT INTO chat_history (user_task_id, task_id, fish, matn, file_paths, original_file_names, vaqt) VALUES (?, ?, ?, ?, ?, ?, ?)';
//         db.query(sql, [user_task_id, task_id, actualFish, matn, filePaths, original_file_names, vaqt], (err, result) => {
//             if (err) {
//                 console.error('Xabar saqlashda xatolik:', err.sqlMessage || err.message); // Batafsil xatolarni ko'rsatish
//                 return res.status(500).json({ message: 'Xabar saqlanmadi', error: err.sqlMessage || err.message });
//             }
//             console.log('Xabar muvaffaqiyatli saqlandi:', result);
//             res.json({ message: 'Xabar muvaffaqiyatli yuborildi' });
//         });
//     });
// });



















// Vazifa detallarini olish
app.get('/api/task-details/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const sql = 'SELECT id, vazifa_nomi AS name, izoh AS description FROM vazifalar WHERE id = ?';
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error('Vazifa detallarini olishda xatolik:', err);
            return res.status(500).json({ message: 'Vazifa detallari yuklanmadi', error: err.message });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.json({ id: taskId, name: 'Noma\'lum vazifa', description: 'Izoh mavjud emas' });
        }
    });
});

// O‘ng tomon detallarini olish
app.get('/api/task-details-right/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const sql = `
        SELECT 
            vazifa_masul_hodimi AS responsible,
            vazifa_boshlanish_sanasi AS start_date,
            vazifa_tugash_sanasi AS end_date,
            project_id AS created_by
        FROM vazifalar
        WHERE id = ?
    `;
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error('O‘ng tomon detallarini olishda xatolik:', err);
            return res.status(500).json({ message: 'O‘ng tomon ma\'lumotlari yuklanmadi', error: err.message });
        }
        if (results.length > 0) {
            const details = results[0];
            const daysDiff = calculateDaysDiff(details.start_date, details.end_date);
            res.json({
                ...details,
                days_diff: daysDiff || 0
            });
        } else {
            res.json({
                responsible: 'Noma\'lum',
                start_date: 'Noma\'lum',
                end_date: 'Noma\'lum',
                days_diff: 0,
                created_by: 'Noma\'lum'
            });
        }
    });
});

// Chat tarixini olish
app.get('/api/chat-history/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const sql = `
        SELECT ch.user_task_id, ch.task_id, u.fish, ch.matn, ch.vaqt, ch.file_paths, ch.original_file_names, COALESCE(ch.is_read, 0) AS is_read 
        FROM chat_history ch 
        LEFT JOIN users u ON ch.user_task_id = u.id 
        WHERE ch.task_id = ?
        ORDER BY ch.vaqt DESC
    `;
    db.query(sql, [taskId], (err, results) => {
        if (err) {
            console.error('Chat tarixi olishda xatolik:', err);
            return res.status(500).json({ message: 'Chat tarixi yuklanmadi', error: err.message });
        }
        console.log(`Chat tarixi javobi uchun taskId ${taskId}:`, results);
        results.forEach((result) => {
            if (!result.fish) console.warn('Fish topilmadi, user_task_id:', result.user_task_id);
            if (result.file_paths) console.log('Fayl yo\'llari:', JSON.parse(result.file_paths));
            if (result.original_file_names) console.log('Original fayl nomlari:', JSON.parse(result.original_file_names));
            console.log('is_read:', result.is_read);
        });
        res.json(results || []);
    });
});

// Xabarlarni o'qilgan deb belgilash
app.post('/api/mark-read/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const { user_task_id } = req.body;
    const sql = 'UPDATE chat_history SET is_read = 1 WHERE task_id = ? AND (is_read IS NULL OR is_read = 0) AND user_task_id != ?';
    db.query(sql, [taskId, user_task_id], (err, result) => {
        if (err) {
            console.error('Xabarlarni o\'qilgan deb belgilashda xatolik:', err);
            return res.status(500).json({ message: 'Xabarlarni yangilashda xatolik', error: err.message });
        }
        console.log('Xabarlar o\'qilgan deb yangilandi:', result.affectedRows, 'ta yozuv o\'zgartirildi, taskId:', taskId, 'user_task_id:', user_task_id);
        if (result.affectedRows === 0) {
            console.log('O\'qilmagan xabar topilmadi yoki barchasi allaqachon o\'qilgan');
        }
        db.query(
            'SELECT COUNT(*) as unreadCount FROM chat_history WHERE task_id = ? AND (is_read IS NULL OR is_read = 0) AND user_task_id != ?',
            [taskId, user_task_id],
            (err, countResult) => {
                if (err) {
                    console.error('O\'qilmagan xabarlar sonini tekshirishda xatolik:', err);
                } else {
                    console.log('O\'qilmagan xabarlar soni yangilandi:', countResult[0].unreadCount);
                }
            }
        );
        res.json({ message: 'Xabarlar muvaffaqiyatli o\'qilgan deb belgilandi', affectedRows: result.affectedRows });
    });
});

// Xabar yuborish va bazada saqlash
app.post('/api/send-message', upload.array('files', 5), (req, res) => {
    const { task_id, user_task_id, fish, matn, original_file_names } = req.body;
    const files = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
    const filePaths = JSON.stringify(files);
    const originalFileNamesArray = original_file_names ? JSON.parse(original_file_names) : [];
    const vaqt = formatDateToMySQL(new Date());

    console.log('Keldi:', { task_id, user_task_id, fish, matn, files, original_file_names: originalFileNamesArray });

    if (!task_id || !user_task_id) {
        console.error('Talab qilinmagan maydonlar:', { task_id, user_task_id });
        return res.status(400).json({ message: 'task_id va user_task_id talab qilinadi' });
    }

    const checkFishSql = 'SELECT fish FROM users WHERE id = ?';
    db.query(checkFishSql, [user_task_id], (err, userResult) => {
        if (err) {
            console.error('Foydalanuvchi tekshirishda xatolik:', err);
            return res.status(500).json({ message: 'Foydalanuvchi topilmadi', error: err.message });
        }
        const actualFish = userResult.length > 0 ? userResult[0].fish : fish || 'Noma\'lum';

        const sql = 'INSERT INTO chat_history (user_task_id, task_id, fish, matn, file_paths, original_file_names, vaqt, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, 0)';
        db.query(sql, [user_task_id, task_id, actualFish, matn, filePaths, original_file_names, vaqt], (err, result) => {
            if (err) {
                console.error('Xabar saqlashda xatolik:', err.sqlMessage || err.message);
                return res.status(500).json({ message: 'Xabar saqlanmadi', error: err.sqlMessage || err.message });
            }
            console.log('Xabar muvaffaqiyatli saqlandi:', result);
            res.json({ message: 'Xabar muvaffaqiyatli yuborildi' });
        });
    });
});





const PORT = 5000
app.listen(PORT, () => {
	console.log(`✅ Server ${PORT} portda ishlamoqda...`)
})