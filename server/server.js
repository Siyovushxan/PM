// Muhit o‘zgaruvchilarini yuklash uchun dotenv kutubxonasi
require('dotenv').config()
const express = require('express') // Web server yaratish uchun Express
const mysql = require('mysql') // MySQL bilan ishlash uchun
const cors = require('cors') // Cross-Origin so‘rovlar uchun
const bcrypt = require('bcrypt') // Parollarni shifrlash uchun
const path = require('path') // Fayl yo‘llari bilan ishlash uchun
const multer = require('multer') // Fayl yuklash uchun
const fs = require('fs') // Fayl tizimi bilan ishlash uchun
const session = require('express-session') // Sessiya boshqaruvi uchun
const winston = require('winston') // Logging uchun

const app = express() // Express ilovasini yaratish

// Logger sozlamalari: xatoliklar va muhim hodisalarni yozish
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' }),
		new winston.transports.Console(),
	],
})

// CORS sozlamalari: qaysi domenlardan so‘rov qabul qilishni belgilaydi
app.use(
	cors({
		origin: process.env.ALLOWED_ORIGINS.split(','), // .env fayldan olingan domenlar
		credentials: true, // Cookie’larni qo‘llab-quvvatlash
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Ruxsat etilgan metodlar
		allowedHeaders: ['Content-Type', 'Authorization'], // Ruxsat etilgan header’lar
	})
)

// Sessiya sozlamalari: foydalanuvchi autentifikatsiyasini boshqarish
app.use(
	session({
		secret: process.env.SESSION_SECRET, // Maxfiy kalit .env’dan olinadi
		resave: false, // Har safar qayta saqlashni oldini olish
		saveUninitialized: false, // Bo‘sh sessiyalarni saqlamaslik
		cookie: {
			secure: process.env.NODE_ENV === 'production', // HTTPS uchun production’da true
			httpOnly: true, // XSS hujumlaridan himoya
			sameSite: 'lax', // CSRF hujumlaridan himoya
			maxAge: 24 * 60 * 60 * 1000, // 24 soatlik sessiya muddati
		},
	})
)

app.use(express.json()) // JSON so‘rovlarni qayta ishlash uchun middleware

// Multer konfiguratsiyasi: fayl yuklash uchun sozlamalar
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = './uploads' // Fayllar saqlanadigan papka
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) // Papka mavjud bo‘lmasa yaratish
		cb(null, dir)
	},
	filename: (req, file, cb) => {
		const fileName = `${Date.now()}-${file.originalname}` // Unikal fayl nomi
		logger.info(`Saqlanayotgan fayl nomi: ${fileName}`)
		cb(null, fileName)
	},
})
const upload = multer({ storage }) // Multer obyektini yaratish

// Statik fayllarni xizmat qilish: uploads va loyiha fayllarini taqdim etish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.static(path.join(__dirname, '../')))

// MySQL ulanish pooli: ko‘p ulanishlarni samarali boshqarish
const db = mysql.createPool({
	connectionLimit: 10, // Maksimal ulanishlar soni
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
})

// MySQL ulanishini tekshirish
db.getConnection((err, connection) => {
	if (err) {
		logger.error(`MySQLga ulanishda xatolik: ${err.message}`)
		return
	}
	logger.info('✅ MySQLga muvaffaqiyatli ulandi!')
	connection.release() // Ulanishni qaytarib berish
})

// Root route: asosiy sahifani qaytarish
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../index.html'))
})

// Sessiyani tekshirish: foydalanuvchi tizimga kirganligini aniqlash
app.get('/api/check-session', (req, res) => {
	logger.info('Sessiyani tekshirish so‘rovi keldi:', req.session)
	if (req.session.userId) {
		res.json({ userId: req.session.userId })
	} else {
		res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' })
	}
})

// Lavozimlar bilan ishlash uchun endpointlar
// Barcha lavozimlarni olish
app.get('/api/positions', (req, res) => {
	const sql = 'SELECT * FROM positions ORDER BY name_uz ASC'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Lavozimlarni olishda xatolik:', err)
			return res.status(500).json({ message: 'Lavozimlarni yuklab bo‘lmadi' })
		}
		res.json(results)
	})
})

// Yangi lavozim qo‘shish
app.post('/api/positions', (req, res) => {
	const { name_uz, name_ru, name_en, parent_position_id } = req.body
	if (!name_uz || !name_ru || !name_en) {
		return res
			.status(400)
			.json({ message: 'Barcha tillardagi lavozim nomlari majburiy!' })
	}

	if (parent_position_id) {
		const checkSql = 'SELECT id FROM positions WHERE id = ?'
		db.query(checkSql, [parent_position_id], (err, results) => {
			if (err || results.length === 0) {
				return res
					.status(400)
					.json({ message: 'Tanlangan yuqori turuvchi lavozim mavjud emas!' })
			}
			const sql =
				'INSERT INTO positions (name_uz, name_ru, name_en, parent_position_id) VALUES (?, ?, ?, ?)'
			db.query(
				sql,
				[name_uz, name_ru, name_en, parent_position_id],
				(err, result) => {
					if (err) {
						logger.error('Lavozim qo‘shishda xatolik:', err)
						if (err.code === 'ER_DUP_ENTRY') {
							return res
								.status(400)
								.json({ message: 'Bu lavozim allaqachon mavjud!' })
						}
						return res
							.status(500)
							.json({ message: 'Lavozim qo‘shishda xatolik yuz berdi' })
					}
					res.status(201).json({ message: 'Lavozim muvaffaqiyatli qo‘shildi!' })
				}
			)
		})
	} else {
		const sql =
			'INSERT INTO positions (name_uz, name_ru, name_en, parent_position_id) VALUES (?, ?, ?, ?)'
		db.query(sql, [name_uz, name_ru, name_en, null], (err, result) => {
			if (err) {
				logger.error('Lavozim qo‘shishda xatolik:', err)
				if (err.code === 'ER_DUP_ENTRY') {
					return res
						.status(400)
						.json({ message: 'Bu lavozim allaqachon mavjud!' })
				}
				return res
					.status(500)
					.json({ message: 'Lavozim qo‘shishda xatolik yuz berdi' })
			}
			res.status(201).json({ message: 'Lavozim muvaffaqiyatli qo‘shildi!' })
		})
	}
})

// Lavozimni tahrirlash
app.put('/api/positions/:id', (req, res) => {
	const positionId = req.params.id
	const { name_uz, name_ru, name_en, parent_position_id } = req.body
	if (!name_uz || !name_ru || !name_en) {
		return res
			.status(400)
			.json({ message: 'Barcha tillardagi lavozim nomlari majburiy!' })
	}

	if (
		parent_position_id &&
		parseInt(parent_position_id) === parseInt(positionId)
	) {
		return res
			.status(400)
			.json({ message: 'Lavozim o‘ziga o‘zi yuqori turuvchi bo‘la olmaydi!' })
	}

	if (parent_position_id) {
		const checkSql = 'SELECT id FROM positions WHERE id = ?'
		db.query(checkSql, [parent_position_id], (err, results) => {
			if (err || results.length === 0) {
				return res
					.status(400)
					.json({ message: 'Tanlangan yuqori turuvchi lavozim mavjud emas!' })
			}
			const sql =
				'UPDATE positions SET name_uz = ?, name_ru = ?, name_en = ?, parent_position_id = ? WHERE id = ?'
			db.query(
				sql,
				[name_uz, name_ru, name_en, parent_position_id, positionId],
				(err, result) => {
					if (err) {
						logger.error('Lavozimni yangilashda xatolik:', err)
						if (err.code === 'ER_DUP_ENTRY') {
							return res
								.status(400)
								.json({ message: 'Bu lavozim allaqachon mavjud!' })
						}
						return res
							.status(500)
							.json({ message: 'Lavozimni yangilashda xatolik' })
					}
					if (result.affectedRows === 0)
						return res.status(404).json({ message: 'Lavozim topilmadi' })
					res.json({ message: 'Lavozim muvaffaqiyatli yangilandi' })
				}
			)
		})
	} else {
		const sql =
			'UPDATE positions SET name_uz = ?, name_ru = ?, name_en = ?, parent_position_id = ? WHERE id = ?'
		db.query(
			sql,
			[name_uz, name_ru, name_en, null, positionId],
			(err, result) => {
				if (err) {
					logger.error('Lavozimni yangilashda xatolik:', err)
					if (err.code === 'ER_DUP_ENTRY') {
						return res
							.status(400)
							.json({ message: 'Bu lavozim allaqachon mavjud!' })
					}
					return res
						.status(500)
						.json({ message: 'Lavozimni yangilashda xatolik' })
				}
				if (result.affectedRows === 0)
					return res.status(404).json({ message: 'Lavozim topilmadi' })
				res.json({ message: 'Lavozim muvaffaqiyatli yangilandi' })
			}
		)
	}
})

// Lavozimni o‘chirish
app.delete('/api/positions/:id', (req, res) => {
	const positionId = req.params.id
	const sql = 'DELETE FROM positions WHERE id = ?'
	db.query(sql, [positionId], (err, result) => {
		if (err) {
			logger.error('Lavozimni o‘chirishda xatolik:', err)
			return res.status(500).json({ message: 'Lavozimni o‘chirishda xatolik' })
		}
		if (result.affectedRows === 0)
			return res.status(404).json({ message: 'Lavozim topilmadi' })
		res.json({ message: 'Lavozim muvaffaqiyatli o‘chirildi!' })
	})
})

// Bo‘limlar bilan ishlash uchun endpointlar
// Barcha bo‘limlarni olish
app.get('/api/departments', (req, res) => {
	const sql = 'SELECT * FROM departments ORDER BY name_uz ASC'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Bo‘limlarni olishda xatolik:', err)
			return res.status(500).json({ message: 'Bo‘limlarni yuklab bo‘lmadi' })
		}
		res.json(results)
	})
})

// Yangi bo‘lim qo‘shish
app.post('/api/departments', (req, res) => {
	const { name_uz, name_ru, name_en, parent_department_id } = req.body
	if (!name_uz || !name_ru || !name_en) {
		return res
			.status(400)
			.json({ message: 'Barcha tillardagi bo‘lim nomlari majburiy!' })
	}

	if (parent_department_id) {
		const checkSql = 'SELECT id FROM departments WHERE id = ?'
		db.query(checkSql, [parent_department_id], (err, results) => {
			if (err || results.length === 0) {
				return res
					.status(400)
					.json({ message: 'Tanlangan yuqori turuvchi bo‘lim mavjud emas!' })
			}
			const sql =
				'INSERT INTO departments (name_uz, name_ru, name_en, parent_department_id) VALUES (?, ?, ?, ?)'
			db.query(
				sql,
				[name_uz, name_ru, name_en, parent_department_id],
				(err, result) => {
					if (err) {
						logger.error('Bo‘lim qo‘shishda xatolik:', err)
						if (err.code === 'ER_DUP_ENTRY') {
							return res
								.status(400)
								.json({ message: 'Bu bo‘lim allaqachon mavjud!' })
						}
						return res
							.status(500)
							.json({ message: 'Bo‘lim qo‘shishda xatolik yuz berdi' })
					}
					res.status(201).json({ message: 'Bo‘lim muvaffaqiyatli qo‘shildi!' })
				}
			)
		})
	} else {
		const sql =
			'INSERT INTO departments (name_uz, name_ru, name_en, parent_department_id) VALUES (?, ?, ?, ?)'
		db.query(sql, [name_uz, name_ru, name_en, null], (err, result) => {
			if (err) {
				logger.error('Bo‘lim qo‘shishda xatolik:', err)
				if (err.code === 'ER_DUP_ENTRY') {
					return res
						.status(400)
						.json({ message: 'Bu bo‘lim allaqachon mavjud!' })
				}
				return res
					.status(500)
					.json({ message: 'Bo‘lim qo‘shishda xatolik yuz berdi' })
			}
			res.status(201).json({ message: 'Bo‘lim muvaffaqiyatli qo‘shildi!' })
		})
	}
})

// Bo‘limni tahrirlash
app.put('/api/departments/:id', (req, res) => {
	const departmentId = req.params.id
	const { name_uz, name_ru, name_en, parent_department_id } = req.body
	if (!name_uz || !name_ru || !name_en) {
		return res
			.status(400)
			.json({ message: 'Barcha tillardagi bo‘lim nomlari majburiy!' })
	}

	if (
		parent_department_id &&
		parseInt(parent_department_id) === parseInt(departmentId)
	) {
		return res
			.status(400)
			.json({ message: 'Bo‘lim o‘ziga o‘zi yuqori turuvchi bo‘la olmaydi!' })
	}

	if (parent_department_id) {
		const checkSql = 'SELECT id FROM departments WHERE id = ?'
		db.query(checkSql, [parent_department_id], (err, results) => {
			if (err || results.length === 0) {
				return res
					.status(400)
					.json({ message: 'Tanlangan yuqori turuvchi bo‘lim mavjud emas!' })
			}
			const sql =
				'UPDATE departments SET name_uz = ?, name_ru = ?, name_en = ?, parent_department_id = ? WHERE id = ?'
			db.query(
				sql,
				[name_uz, name_ru, name_en, parent_department_id, departmentId],
				(err, result) => {
					if (err) {
						logger.error('Bo‘limni yangilashda xatolik:', err)
						if (err.code === 'ER_DUP_ENTRY') {
							return res
								.status(400)
								.json({ message: 'Bu bo‘lim allaqachon mavjud!' })
						}
						return res
							.status(500)
							.json({ message: 'Bo‘limni yangilashda xatolik' })
					}
					if (result.affectedRows === 0)
						return res.status(404).json({ message: 'Bo‘lim topilmadi' })
					res.json({ message: 'Bo‘lim muvaffaqiyatli yangilandi' })
				}
			)
		})
	} else {
		const sql =
			'UPDATE departments SET name_uz = ?, name_ru = ?, name_en = ?, parent_department_id = ? WHERE id = ?'
		db.query(
			sql,
			[name_uz, name_ru, name_en, null, departmentId],
			(err, result) => {
				if (err) {
					logger.error('Bo‘limni yangilashda xatolik:', err)
					if (err.code === 'ER_DUP_ENTRY') {
						return res
							.status(400)
							.json({ message: 'Bu bo‘lim allaqachon mavjud!' })
					}
					return res
						.status(500)
						.json({ message: 'Bo‘limni yangilashda xatolik' })
				}
				if (result.affectedRows === 0)
					return res.status(404).json({ message: 'Bo‘lim topilmadi' })
				res.json({ message: 'Bo‘lim muvaffaqiyatli yangilandi' })
			}
		)
	}
})

// Bo‘limni o‘chirish
app.delete('/api/departments/:id', (req, res) => {
	const departmentId = req.params.id
	const sql = 'DELETE FROM departments WHERE id = ?'
	db.query(sql, [departmentId], (err, result) => {
		if (err) {
			logger.error('Bo‘limni o‘chirishda xatolik:', err)
			return res.status(500).json({ message: 'Bo‘limni o‘chirishda xatolik' })
		}
		if (result.affectedRows === 0)
			return res.status(404).json({ message: 'Bo‘lim topilmadi' })
		res.json({ message: 'Bo‘lim muvaffaqiyatli o‘chirildi!' })
	})
})

// Loyihaga tegishli vazifalarni olish
app.get('/api/vazifalar', (req, res) => {
	const projectId = req.query.project_id
	if (!projectId)
		return res.status(400).json({ message: 'project_id majburiy parametr!' })

	const sql = 'SELECT * FROM vazifalar WHERE project_id = ?'
	db.query(sql, [projectId], (err, results) => {
		if (err) {
			logger.error('Vazifalarni olishda xatolik:', err)
			return res.status(500).json({ message: "Vazifalarni yuklab bo'lmadi" })
		}
		const normalizedResults = results.map(task => ({
			...task,
			vazifa_status: task.vazifa_status ? task.vazifa_status.toLowerCase() : '',
		}))
		res.json(normalizedResults)
	})
})

// Barcha vazifalarni olish
app.get('/api/all-vazifalar', (req, res) => {
	const sql = 'SELECT * FROM vazifalar'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Vazifalarni olishda xatolik:', err)
			return res.status(500).json({ message: "Vazifalarni yuklab bo'lmadi" })
		}
		const normalizedResults = results.map(task => ({
			...task,
			vazifa_status: task.vazifa_status ? task.vazifa_status.toLowerCase() : '',
		}))
		res.json(normalizedResults)
	})
})

// Yangi vazifa qo‘shish
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
	const normalizedStatus = vazifa_status.toLowerCase()
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
				logger.error('Vazifa qo‘shishda xatolik:', err)
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
			logger.error('Vazifa ma’lumotlarini olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: "Vazifa ma’lumotlari yuklab bo'lmadi" })
		}
		if (results.length > 0) res.json(results[0])
		else res.status(404).json({ message: 'Vazifa topilmadi' })
	})
})

// Vazifa detallarini o‘ng tomon uchun olish (modal uchun)
app.get('/api/vazifalar-details-right/:taskId', (req, res) => {
	const taskId = req.params.taskId
	const sql =
		'SELECT vazifa_masul_hodimi AS responsible, vazifa_boshlanish_sanasi AS start_date, vazifa_tugash_sanasi AS end_date, vazifa_status AS status FROM vazifalar WHERE id = ?'
	db.query(sql, [taskId], (err, results) => {
		if (err) {
			logger.error('Detallarni olishda xatolik:', err)
			return res.status(500).json({ message: "Detallar yuklab bo'lmadi" })
		}
		if (results.length > 0) {
			const normalizedResult = {
				...results[0],
				status: results[0].status ? results[0].status.toLowerCase() : '',
			}
			res.json(normalizedResult)
		} else {
			res.status(404).json({ message: 'Vazifa topilmadi' })
		}
	})
})

// Yangi loyiha qo‘shish
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
				logger.error('Loyiha qo‘shishda xatolik:', err)
				return res
					.status(500)
					.json({ message: 'Loyiha qo‘shishda xatolik yuz berdi' })
			}
			res.status(201).json({ message: 'Loyiha muvaffaqiyatli qo‘shildi!' })
		}
	)
})

// Faol loyihalarni olish
app.get('/api/projects', (req, res) => {
	const sql = 'SELECT * FROM projects WHERE is_archived = 0 ORDER BY id ASC'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Loyihalarni olishda xatolik:', err)
			return res.status(500).json({ message: "Loyihalarni yuklab bo'lmadi" })
		}
		res.json(results)
	})
})

// Loyihalar statistikasi uchun endpoint
app.get('/api/loyihalar', (req, res) => {
	const sql = 'SELECT * FROM projects'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Loyihalarni olishda xatolik:', err)
			return res.status(500).json({ message: "Loyihalarni yuklab bo'lmadi" })
		}
		const normalizedResults = results.map(project => ({
			...project,
			status: project.status ? project.status.toLowerCase() : '',
		}))
		res.json(normalizedResults)
	})
})

// Loyiha ma'lumotlarini olish
app.get('/api/projects/:id', (req, res) => {
	const projectId = req.params.id
	const sql = 'SELECT * FROM projects WHERE id = ?'
	db.query(sql, [projectId], (err, result) => {
		if (err) {
			logger.error('Loyihani olishda xatolik:', err)
			return res.status(500).json({ message: "Loyihani yuklab bo'lmadi" })
		}
		if (result.length === 0)
			return res.status(404).json({ message: 'Loyiha topilmadi' })
		res.json(result[0])
	})
})

// Loyihani yangilash
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
				logger.error('Loyihani yangilashda xatolik:', err)
				return res.status(500).json({ message: 'Loyihani yangilashda xatolik' })
			}
			if (result.affectedRows === 0)
				return res.status(404).json({ message: 'Loyiha topilmadi' })
			res.json({ message: 'Loyiha muvaffaqiyatli yangilandi' })
		}
	)
})

// Loyihani o‘chirish
app.delete('/api/projects/:id', (req, res) => {
	const projectId = req.params.id
	const sql = 'DELETE FROM projects WHERE id = ?'
	db.query(sql, [projectId], (err, result) => {
		if (err) {
			logger.error('Loyihani o‘chirishda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		res.json({ message: 'Loyiha muvaffaqiyatli o‘chirildi!' })
	})
})

// Vazifani yangilash
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
	const normalizedStatus = vazifa_status ? vazifa_status.toLowerCase() : ''
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
				logger.error('Vazifa yangilashda xatolik:', err)
				return res.status(500).json({ message: 'Vazifa yangilanishda xatolik' })
			}
			res.json({ message: 'Vazifa muvaffaqiyatli yangilandi' })
		}
	)
})

// Login endpointi: foydalanuvchi tizimga kirishi
app.post('/api/login', (req, res) => {
	const { username, password } = req.body
	if (!username || !password)
		return res.status(400).json({ message: 'Login va parol majburiy!' })

	const sql = 'SELECT * FROM users WHERE username = ?'
	db.query(sql, [username], async (err, results) => {
		if (err) {
			logger.error('MySQL xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (results.length === 0)
			return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri!' })

		const user = results[0]
		try {
			const isMatch = await bcrypt.compare(password, user.password)
			if (isMatch) {
				req.session.userId = user.id.toString()
				req.session.save(err => {
					if (err) {
						logger.error('Sessiya saqlashda xatolik:', err)
						return res
							.status(500)
							.json({ message: 'Sessiya saqlashda xatolik' })
					}
					logger.info('Sessiya saqlandi:', req.session)
					res.json({
						message: 'Tizimga muvaffaqiyatli kirdingiz!',
						userId: user.id.toString(),
					})
				})
			} else {
				return res.status(401).json({ message: 'Login yoki parol noto‘g‘ri!' })
			}
		} catch (bcryptError) {
			logger.error('Parol tekshirishda xatolik:', bcryptError)
			return res.status(500).json({ message: 'Server xatosi' })
		}
	})
})

// Foydalanuvchi ma'lumotlarini olish
app.get('/api/user/:userId', (req, res) => {
	const userId = req.params.userId
	const sql = 'SELECT FISH, Bulim, Lavozim FROM users WHERE id = ?'
	db.query(sql, [userId], (err, results) => {
		if (err) {
			logger.error("Foydalanuvchi ma'lumotlarini olishda xatolik:", err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (results.length === 0)
			return res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
		res.json(results[0])
	})
})

// Barcha foydalanuvchilarni olish
app.get('/api/users', (req, res) => {
	const sql =
		'SELECT id, username, created_at, fish, bulim, parent_bulim, lavozim, role FROM users'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Foydalanuvchilarni olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Foydalanuvchilarni yuklashda xatolik yuz berdi.' })
		}
		res.json(results)
	})
})

// Barcha bo‘limlarni olish (users jadvalidan)
app.get('/api/bulims', (req, res) => {
	const query = 'SELECT DISTINCT Bulim, parent_bulim FROM users'
	db.query(query, (err, results) => {
		if (err) {
			logger.error('Bo‘limlarni olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Bo‘limlarni olishda xatolik', error: err.message })
		}
		const bulims = new Set()
		results.forEach(row => {
			if (row.Bulim) bulims.add(row.Bulim)
			if (row.parent_bulim) bulims.add(row.parent_bulim)
		})
		res.json(Array.from(bulims).map(bulim => ({ Bulim: bulim })))
	})
})

// Foydalanuvchilarni tahrirlash
app.put('/api/users/:id', async (req, res) => {
	const userId = req.params.id
	const requesterId = req.session.userId

	if (!requesterId)
		return res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' })

	const sqlCheckRole = 'SELECT role FROM users WHERE id = ?'
	db.query(sqlCheckRole, [requesterId], (err, results) => {
		if (err) {
			logger.error('Role tekshirishda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (results.length === 0 || results[0].role !== 'admin') {
			return res
				.status(403)
				.json({ message: 'Sizda bu amalni bajarish uchun ruxsat yo‘q' })
		}

		const { fish, bulim, parent_bulim, lavozim, login, role } = req.body
		if (!fish || !bulim || !lavozim || !login || !role) {
			return res.status(400).json({ message: 'Barcha maydonlarni to‘ldiring!' })
		}

		const checkUsernameSql =
			'SELECT id FROM users WHERE username = ? AND id != ?'
		db.query(checkUsernameSql, [login, userId], (err, usernameResults) => {
			if (err) {
				logger.error('Username tekshirishda xatolik:', err)
				return res.status(500).json({ message: 'Server xatosi' })
			}

			const sql =
				'UPDATE users SET fish = ?, bulim = ?, parent_bulim = ?, lavozim = ?, username = ?, role = ? WHERE id = ?'
			const values = [
				fish,
				bulim,
				parent_bulim || null,
				lavozim,
				login,
				role,
				userId,
			]
			db.query(sql, values, (err, result) => {
				if (err) {
					logger.error("Foydalanuvchi ma'lumotlarini yangilashda xatolik:", err)
					return res
						.status(500)
						.json({
							message:
								"Foydalanuvchi ma'lumotlarini yangilashda xatolik yuz berdi.",
						})
				}
				if (result.affectedRows === 0)
					return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' })
				res.json({
					message: "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi!",
				})
			})
		})
	})
})

// Foydalanuvchi parolini tiklash
app.put('/api/users/:id/reset-password', async (req, res) => {
	const userId = req.params.id
	const { newPassword } = req.body

	if (!newPassword)
		return res.status(400).json({ message: 'Yangi parol majburiy!' })

	try {
		const hashedPassword = await bcrypt.hash(newPassword, 10)
		const sql = 'UPDATE users SET password = ? WHERE id = ?'
		db.query(sql, [hashedPassword, userId], (err, result) => {
			if (err) {
				logger.error('Parolni tiklashda xatolik:', err)
				return res
					.status(500)
					.json({ message: 'Parolni tiklashda xatolik yuz berdi.' })
			}
			if (result.affectedRows === 0)
				return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' })
			res.json({ message: 'Parol muvaffaqiyatli tiklandi!' })
		})
	} catch (error) {
		logger.error('Serverda xatolik:', error)
		res
			.status(500)
			.json({ message: 'Serverda xatolik yuz berdi.', error: error.message })
	}
})

// Foydalanuvchini o‘chirish
app.delete('/api/users/:id', (req, res) => {
	const userId = req.params.id
	const sql = 'DELETE FROM users WHERE id = ?'
	db.query(sql, [userId], (err, result) => {
		if (err) {
			logger.error('Foydalanuvchini o‘chirishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Foydalanuvchini o‘chirishda xatolik yuz berdi.' })
		}
		if (result.affectedRows === 0)
			return res.status(404).json({ message: 'Foydalanuvchi topilmadi.' })
		res.json({ message: 'Foydalanuvchi muvaffaqiyatli o‘chirildi!' })
	})
})

// Chat tarixini olish (paginatsiya qo‘shildi)
app.get('/api/chat-history/:taskId', (req, res) => {
	const taskId = req.params.taskId
	const page = parseInt(req.query.page) || 1 // Sahifa raqami
	const limit = parseInt(req.query.limit) || 10 // Har sahifadagi yozuvlar soni
	const offset = (page - 1) * limit

	const sql = `
    SELECT ch.user_task_id, ch.task_id, u.fish, ch.matn, ch.vaqt, ch.file_paths, ch.is_result 
    FROM chat_history ch 
    LEFT JOIN users u ON ch.user_task_id = u.id 
    WHERE ch.task_id = ? 
    ORDER BY ch.vaqt ASC 
    LIMIT ? OFFSET ?
  `
	db.query(sql, [taskId, limit, offset], (err, results) => {
		if (err) {
			logger.error('Chat tarixini olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Chat tarixi yuklanmadi', error: err.message })
		}
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

	if (!task_id || !user_task_id || !fish) {
		return res
			.status(400)
			.json({ message: 'task_id, user_task_id va fish majburiy!' })
	}

	const parsedTaskId = parseInt(task_id)
	const parsedUserTaskId = parseInt(user_task_id)
	if (isNaN(parsedTaskId) || isNaN(parsedUserTaskId)) {
		return res
			.status(400)
			.json({ message: 'task_id va user_task_id son bo‘lishi kerak!' })
	}

	db.query(
		'SELECT id FROM vazifalar WHERE id = ?',
		[parsedTaskId],
		(err, results) => {
			if (err || results.length === 0) {
				logger.error('Vazifa topilmadi:', parsedTaskId)
				return res
					.status(404)
					.json({ message: 'Belgilangan vazifa topilmadi!' })
			}

			db.query(
				'SELECT id FROM users WHERE id = ?',
				[parsedUserTaskId],
				(err, userResults) => {
					if (err || userResults.length === 0) {
						logger.error('Foydalanuvchi topilmadi:', parsedUserTaskId)
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
								logger.error('Xabar saqlashda xatolik:', err)
								return res
									.status(500)
									.json({ message: 'Xabar saqlanmadi', error: err.message })
							}
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

// Vazifa statusini yangilash
app.post('/api/update-task-status', (req, res) => {
	const { taskId } = req.body
	if (!taskId) return res.status(400).json({ message: 'Task ID is required' })

	const query = 'UPDATE vazifalar SET vazifa_status = ? WHERE id = ?'
	db.query(query, ['Yakunlandi', taskId], (err, result) => {
		if (err) {
			logger.error('Vazifa statusini yangilashda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (result.affectedRows === 0)
			return res.status(404).json({ message: 'Vazifa topilmadi' })
		res.json({ message: 'Vazifa statusi muvaffaqiyatli yangilandi' })
	})
})

// Rolga asoslangan ruxsatni tekshirish
app.get('/api/check-permission', (req, res) => {
	const userId = req.query.userId
	if (!userId)
		return res
			.status(401)
			.json({ message: 'Foydalanuvchi tizimga kirmagan', authorized: false })

	const sql = 'SELECT role FROM users WHERE id = ?'
	db.query(sql, [userId], (err, results) => {
		if (err) {
			logger.error('Ruxsatni tekshirishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Server xatosi', authorized: false })
		}
		if (results.length === 0)
			return res
				.status(404)
				.json({ message: 'Foydalanuvchi topilmadi', authorized: false })
		const role = results[0].role || 'user'
		const authorized = role === 'admin'
		res.json({ authorized, role })
	})
})

// Loyiha bo'yicha vazifalarni olish
app.get('/api/vazifalar/:project_id', (req, res) => {
	const projectId = parseInt(req.params.project_id)
	if (isNaN(projectId))
		return res.status(400).json({ message: 'Noto‘g‘ri loyiha ID' })

	const sql = 'SELECT * FROM vazifalar WHERE project_id = ?'
	db.query(sql, [projectId], (err, results) => {
		if (err) {
			logger.error('Vazifalarni olishda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		res.json(results.length > 0 ? results : [])
	})
})

// Yangi foydalanuvchi qo‘shish
app.post('/api/users', async (req, res) => {
	const {
		fish,
		bulim,
		parent_bulim,
		lavozim,
		login,
		password,
		role,
		created_at,
	} = req.body
	if (!fish || !bulim || !lavozim || !login || !password || !role) {
		return res.status(400).json({ message: 'Barcha maydonlarni to‘ldiring!' })
	}

	const checkUsernameSql = 'SELECT id FROM users WHERE username = ?'
	db.query(checkUsernameSql, [login], async (err, results) => {
		if (err) {
			logger.error('Username tekshirishda xatolik:', err)
			return res
				.status(500)
				.json({ message: 'Server xatosi', error: err.message })
		}

		try {
			const hashedPassword = await bcrypt.hash(password, 10)
			const formattedCreatedAt = created_at
				? new Date(created_at).toISOString().slice(0, 19).replace('T', ' ')
				: new Date().toISOString().slice(0, 19).replace('T', ' ')
			const query =
				'INSERT INTO users (FISH, Bulim, parent_bulim, Lavozim, username, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
			const values = [
				fish,
				bulim,
				parent_bulim || null,
				lavozim,
				login,
				hashedPassword,
				role,
				formattedCreatedAt,
			]
			db.query(query, values, (err, result) => {
				if (err) {
					logger.error('Foydalanuvchi qo‘shishda xatolik:', err)
					return res
						.status(500)
						.json({
							message: 'Foydalanuvchi qo‘shishda xatolik yuz berdi.',
							error: err.message,
						})
				}
				res
					.status(201)
					.json({ message: 'Foydalanuvchi muvaffaqiyatli qo‘shildi!' })
			})
		} catch (error) {
			logger.error('Serverda xatolik:', error)
			res
				.status(500)
				.json({ message: 'Serverda xatolik yuz berdi.', error: error.message })
		}
	})
})

// Loyihani arxivga o‘tkazish
app.post('/api/projects/archive/:id', (req, res) => {
	const projectId = req.params.id
	const { password } = req.body
	const ARCHIVE_PASSWORD = process.env.ARCHIVE_PASSWORD

	if (password !== ARCHIVE_PASSWORD)
		return res.status(401).json({ message: 'Parol noto‘g‘ri!' })

	const sql = 'UPDATE projects SET is_archived = 1 WHERE id = ?'
	db.query(sql, [projectId], (err, result) => {
		if (err) {
			logger.error('Loyihani arxivga o‘tkazishda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (result.affectedRows === 0)
			return res.status(404).json({ message: 'Loyiha topilmadi' })
		res.json({ message: 'Loyiha muvaffaqiyatli arxivga o‘tkazildi!' })
	})
})

// Arxivlangan loyihalarni olish
app.get('/api/archived-projects', (req, res) => {
	const sql = 'SELECT * FROM projects WHERE is_archived = 1 ORDER BY id ASC'
	db.query(sql, (err, results) => {
		if (err) {
			logger.error('Arxivlangan loyihalarni olishda xatolik:', err)
			return res
				.status(500)
				.json({ message: "Arxivlangan loyihalarni yuklab bo'lmadi" })
		}
		res.json(results)
	})
})

// Loyihani arxivdan faol holatga qaytarish
app.post('/api/projects/unarchive/:id', (req, res) => {
	const projectId = req.params.id
	const { password } = req.body
	const ARCHIVE_PASSWORD = process.env.ARCHIVE_PASSWORD

	if (password !== ARCHIVE_PASSWORD)
		return res.status(401).json({ message: 'Parol noto‘g‘ri!' })

	const sql = 'UPDATE projects SET is_archived = 0 WHERE id = ?'
	db.query(sql, [projectId], (err, result) => {
		if (err) {
			logger.error('Loyihani faollashtirishda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (result.affectedRows === 0)
			return res.status(404).json({ message: 'Loyiha topilmadi' })
		res.json({ message: 'Loyiha muvaffaqiyatli faollashtirildi!' })
	})
})

// Foydalanuvchi bo‘limini olish
app.get('/api/user-department', (req, res) => {
	const userId = req.session.userId
	if (!userId)
		return res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' })

	const sql = 'SELECT bulim AS department FROM users WHERE id = ?' // "department" o‘rniga "bulim" ishlatildi
	db.query(sql, [userId], (err, results) => {
		if (err) {
			logger.error('Foydalanuvchi bo‘limini olishda xatolik:', err)
			return res.status(500).json({ message: 'Server xatosi' })
		}
		if (results.length === 0)
			return res.status(404).json({ message: 'Foydalanuvchi topilmadi' })
		res.json({ department: results[0].department })
	})
})

// Autentifikatsiyani tekshirish
app.get('/api/check-auth', (req, res) => {
	if (req.session.userId) {
		res
			.status(200)
			.json({
				message: 'Foydalanuvchi autentifikatsiya qilingan',
				userId: req.session.userId,
			})
	} else {
		res.status(401).json({ message: 'Foydalanuvchi tizimga kirmagan' })
	}
})

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
	logger.info(`✅ Server ${PORT} portda ishlamoqda...`)
})

// Yordamchi funksiyalar
function formatDateToMySQL(date) {
	// MySQL uchun sana formatlash
	return date.toISOString().slice(0, 19).replace('T', ' ')
}

function calculateDaysDiff(startDate, endDate) {
	// Ikki sana orasidagi kunlar farqini hisoblash
	const start = new Date(startDate)
	const end = new Date(endDate)
	const diffTime = Math.abs(end - start)
	return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
