const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const bcrypt = require('bcrypt')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const session = require('express-session')

const app = express()
app.use(cors())
app.use(express.json())
app.use(
	session({
		secret: 'secret-key', // Maxfiy kalitni o'zgartiring
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false }, // HTTPS uchun true qiling
	})
)

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
		console.log('Saqlanayotgan fayl nomi:', fileName)
		cb(null, fileName)
	},
})
const upload = multer({ storage: storage })

// Statik fayllarni xizmat qilish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.static(path.join(__dirname)))

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

// Sessionni tekshirish endpointi
app.get('/api/check-session', (req, res) => {
	if (req.session.userId) {
		res.json({ userId: req.session.userId })
	} else {
		res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' })
	}
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
	const taskId = req.params.taskId
	const sql =
		'SELECT vazifa_masul_hodimi AS responsible, vazifa_boshlanish_sanasi AS start_date, vazifa_tugash_sanasi AS end_date, vazifa_status AS status FROM vazifalar WHERE id = ?'
	db.query(sql, [taskId], (err, results) => {
		if (err) {
			console.error('Xatolik:', err)
			return res.status(500).json({ message: "Detallar yuklab bo'lmadi" })
		}
		if (results.length > 0) {
			res.json(results[0])
		} else {
			res.status(404).json({ message: 'Vazifa topilmadi' })
		}
	})
})

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
				req.session.userId = user.id.toString()
				res.json({
					message: 'Tizimga muvaffaqiyatli kirdingiz!',
					userId: user.id.toString(),
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
		res.json({ FISH: user.FISH, Bulim: user.Bulim, Lavozim: user.Lavozim })
	})
})

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
