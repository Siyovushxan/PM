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
		cb(null, Date.now() + '-' + file.originalname)
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

// Statik fayllarni xizmat qilish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Vaqtni MySQL formatiga o'zgartirish funksiyasi
function formatDateToMySQL(date) {
	return date.toISOString().slice(0, 19).replace('T', ' ') // YYYY-MM-DD HH:mm:ss
}

// Chat tarixini olish
app.get('/api/chat-history/:taskId', (req, res) => {
	const taskId = req.params.taskId
	const sql =
		'SELECT user_task_id, task_id, fish, matn, vaqt, file_paths FROM chat_history WHERE task_id = ? ORDER BY vaqt DESC'
	db.query(sql, [taskId], (err, results) => {
		if (err) {
			console.error('Chat tarixi olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Chat tarixi yuklanmadi', error: err.message })
		}
		res.json(results || [])
	})
})

// Xabar yuborish va saqlash
app.post('/api/send-message', upload.array('files', 5), (req, res) => {
	const { task_id, user_task_id, fish, matn } = req.body
	const files = req.files
		? req.files.map(file => `/uploads/${file.filename}`)
		: []
	const filePaths = JSON.stringify(files)
	const vaqt = formatDateToMySQL(new Date()) // MySQL formatiga o'zgartirish

	console.log('Keldi:', { task_id, user_task_id, fish, matn, files }) // Debugging

	if (!task_id || !user_task_id) {
		console.error('Talab qilinmagan maydonlar:', { task_id, user_task_id })
		return res
			.status(400)
			.json({ message: 'task_id va user_task_id talab qilinadi' })
	}

	const sql =
		'INSERT INTO chat_history (user_task_id, task_id, fish, matn, file_paths, vaqt) VALUES (?, ?, ?, ?, ?, ?)'
	db.query(
		sql,
		[user_task_id, task_id, fish, matn, filePaths, vaqt],
		(err, result) => {
			if (err) {
				console.error('Xabar saqlashda xatolik:', err.sqlMessage || err.message)
				return res.status(500).json({
					message: 'Xabar saqlanmadi',
					error: err.sqlMessage || err.message,
				})
			}
			console.log('Xabar muvaffaqiyatli saqlandi:', result)
			res.json({ message: 'Xabar muvaffaqiyatli yuborildi' })
		}
	)
})



const PORT = 5000
app.listen(PORT, () => {
	console.log(`✅ Server ${PORT} portda ishlamoqda...`)
})
