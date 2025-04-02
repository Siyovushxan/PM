document.addEventListener('DOMContentLoaded', () => {
	const projectsContainer = document.querySelector('.projects')
	const editModal = document.getElementById('editModal')
	const editForm = document.getElementById('edit-form')
	const closeModal = document.querySelector('.close')
	const taskModal = document.getElementById('taskModal')
	const taskForm = document.getElementById('task-form')
	const closeTask = document.querySelector('.close-task')
	const roadmapModal = document.getElementById('roadmapModal')
	const closeRoadmap = document.querySelector('.close-roadmap')
	const roadmapContent = document.getElementById('roadmap-content')

	let currentProjectId = null

	// Sana formatini o‘zgartirish funksiyasi (YYYY-MM-DD -> 2025 yil may)
	function formatDateForDisplay(dateString) {
		if (!dateString) return 'N/A'
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return 'N/A'
		const year = date.getFullYear()
		const monthNames = [
			'yanvar',
			'fevral',
			'mart',
			'aprel',
			'may',
			'iyun',
			'iyul',
			'avgust',
			'sentyabr',
			'oktyabr',
			'noyabr',
			'dekabr',
		]
		const month = monthNames[date.getMonth()]
		return `${year} yil ${month}`
	}

	// Sana formatini o‘zgartirish funksiyasi (YYYY-MM-DD -> DD.MM.YYYY)
	function formatDate(dateString) {
		if (!dateString) return 'N/A'
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return 'N/A'
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}.${month}.${year}`
	}

	// Sanani "YYYY-MM-DD" formatiga aylantirish (input uchun)
	function formatDateForInput(dateString) {
		if (!dateString) return ''
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return ''
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// Sanani "YYYY-MM-DD" formatiga aylantirish (inputdan kelgan sanalar uchun)
	function parseDate(dateString) {
		if (!dateString) return null
		const [day, month, year] = dateString.split('.')
		if (day && month && year) {
			return `${year}-${month}-${day}`
		}
		return dateString
	}

	// Kunlar farqini hisoblash funksiyasi (boshlanish va tugash orasidagi kunlar)
	function getDaysDifference(startDate, endDate) {
		const start = new Date(parseDate(startDate))
		const end = new Date(parseDate(endDate))
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
		const differenceMs = end - start
		const differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24))
		return differenceDays > 0 ? differenceDays : 0
	}

	// Tugashgacha qolgan yoki o‘tgan kunlarni hisoblash
	function getDaysUntilEnd(endDate) {
		const now = new Date()
		const end = new Date(parseDate(endDate))
		if (isNaN(end.getTime())) return 0
		const differenceMs = end - now
		const differenceDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1
		return differenceDays >= 0 ? differenceDays : -Math.abs(differenceDays)
	}

	// Holatni aniqlash va rang qo‘shish
	function getProjectStatusText(daysUntilEnd, startDate) {
		const now = new Date()
		const start = new Date(parseDate(startDate))
		if (isNaN(now.getTime()) || isNaN(start.getTime())) return 'MUDDAT: N/A'
		if (now <= start) {
			return `<span style="color: #2ecc71;">MUDDAT: ${daysUntilEnd} KUN</span>`
		} else if (daysUntilEnd < 0) {
			const daysOverdue = -daysUntilEnd
			return `<span style="color: #e74c3c;">MUDDAT: ${daysOverdue} KUNGA KECHIKDI</span>`
		} else if (daysUntilEnd === 0) {
			return `<span style="color: #f1c40f;">MUDDAT: BUGUN</span>`
		} else if (daysUntilEnd <= 10) {
			return `<span style="color: #2ecc71;">MUDDAT: ${daysUntilEnd} KUN QOLDI</span>`
		}
		return `MUDDAT: ${daysUntilEnd} KUN QOLDI`
	}

	// Loyiha uchun vazifalarni olish
	async function getTasksByProject(projectId) {
		try {
			const response = await fetch(
				`http://localhost:5000/api/vazifalar?project_id=${projectId}`
			)
			if (!response.ok) {
				const errorText = await response.text()
				console.error(`Vazifalar yuklanmadi: ${response.status} - ${errorText}`)
				return []
			}
			const tasks = await response.json()
			return Array.isArray(tasks) ? tasks : []
		} catch (error) {
			console.error(
				`Vazifalarni olishda xatolik (Loyiha ID: ${projectId}):`,
				error.message
			)
			return []
		}
	}

	// Loyiha uchun vazifalar sonini olish (faqat umumiy son)
	async function getTaskCount(projectId) {
		try {
			const response = await fetch(
				`http://localhost:5000/api/vazifalar?project_id=${projectId}`
			)
			if (!response.ok) {
				throw new Error(`Vazifalarni olishda xatolik: ${response.status}`)
			}
			const tasks = await response.json()
			return tasks.length
		} catch (error) {
			console.error(
				`Vazifalar sonini olishda xatolik (Loyiha ID: ${projectId}):`,
				error
			)
			return 0
		}
	}

	// Jadvalni Word hujjati sifatida yuklab olish
	function downloadAsWord(projectName, tasks, department) {
		const htmlContent = `
			<html xmlns:o="urn:schemas-microsoft-com:office:office"
				  xmlns:w="urn:schemas-microsoft-com:office:word"
				  xmlns="http://www.w3.org/TR/REC-html40">
				<head>
					<meta charset="UTF-8">
					<style>
						@page {
							size: A4 landscape;
							margin: 2cm;
						}
						@page Section1 {
							size: 841.9pt 595.3pt;
							mso-page-orientation: landscape;
							margin: 2cm 2cm 2cm 2cm;
						}
						div.Section1 {
							page: Section1;
						}
						body {
							font-family: "Times New Roman", sans-serif;
							margin: 0;
							padding: 0;
						}
						.header-text {
							text-align: center;
							font-size: 14pt;
							font-weight: bold;
							margin-bottom: 15px;
						}
						.sub-header-text {
							margin-bottom: 20px;
							margin-left: 730px;
							font-size: 14pt;
							text-align: center;
						}
						.department-box {
							text-align: center;
							font-size: 14pt;
							font-weight: bold;
							border: 2px solid red;
							padding: 5px;
							margin: 10px 0;
						}
						table {
							width: 100%;
							border-collapse: collapse;
							font-family: "Calibri", sans-serif;
							font-size: 14pt;
						}
						tr {
							text-align: center;
						}
						th, td {
							border: 0.1px solid black;
							padding: 10px;
							text-align: left;
							vertical-align: top;
						}
						th {
							font-weight: bold;
						}
					</style>
				</head>
				<body>
					<div class="Section1">
						<div class="sub-header-text">
							"Navoiyuran" davlat korxonasi <br> 2025 yil yanvarda - sonli <br> Buyrug‘iga <br> 1-ilova
						</div>
						<div class="header-text">
							"Navoiyuran" davlat korxonasining 2025 yil <br> <br> raqamli transformatsiyani joriy etish bo‘limi <br> YO‘L XARITASI
						</div>
						<div class="department-box">
							${department}
						</div>
						<table>
							<thead>
								<tr>
									<th>№</th>
									<th>Chora-tadbirlar nomi</th>
									<th>Amalga oshiriladigan mexanizm</th>
									<th>Ijro muddati</th>
									<th>Ijro uchun mas’ul</th>
								</tr>
							</thead>
							<tbody>
								${tasks
									.map(
										(task, index) => `
									<tr>
										<td>${index + 1}</td>
										<td>${task.vazifa_nomi || 'N/A'}</td>
										<td>${task.izoh || 'N/A'}</td>
										<td>${task.vazifa_tugash_sanasi || 'N/A'}</td>
										<td>${task.vazifa_masul_hodimi || 'N/A'}</td>
									</tr>
								`
									)
									.join('')}
							</tbody>
						</table>
					</div>
				</body>
			</html>
		`

		const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${projectName}_roadmap.doc`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	// Barcha loyihalarni olish va ko‘rsatish
	async function loadProjects() {
		try {
			const response = await fetch('http://localhost:5000/api/projects')
			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(
					`Server javobi: ${response.status} - ${response.statusText} - ${errorText}`
				)
			}

			const projects = await response.json()

			if (!projects || projects.length === 0) {
				projectsContainer.innerHTML = "<p>Hozircha hech qanday loyiha yo'q.</p>"
				return
			}

			projectsContainer.innerHTML = ''
			for (const project of projects) {
				const taskCount = await getTaskCount(project.id)

				const projectCard = document.createElement('div')
				projectCard.classList.add('project-card')

				const totalDays = getDaysDifference(project.startDate, project.endDate)
				const daysUntilEnd = getDaysUntilEnd(project.endDate)
				const statusText = getProjectStatusText(daysUntilEnd, project.startDate)

				projectCard.innerHTML = `
                    <h3 class="project-title" data-id="${project.id}">
                        ${
													project.name || 'N/A'
												} <span class="task-hint" style="font-size: 0.8em; color: #777;">- Vazifalar bu yerda</span>
                    </h3>
                    <p class="project-description">${
											project.description || 'N/A'
										}</p>
                    <p class="project-dates">Boshlanish: ${formatDate(
											project.startDate
										)} | Tugash: ${formatDate(
					project.endDate
				)} | ${statusText}</p>
                    <p class="project-status">Status: <span class="status">${
											project.status ? project.status.toUpperCase() : 'N/A'
										}</span></p>
                    <p class="project-status">Mas'ul hodim: <span class="status">${
											project.responsible || 'N/A'
										}</span></p>
                    <p class="project-status">Vazifalar soni: <span class="status">${taskCount}</span></p>
                    <div class="bottons">
                        <div class="left">
                            <button class="edit-btn" data-id="${
															project.id || 0
														}">Tahrirlash</button>
                            <button class="delete-btn" data-id="${
															project.id || 0
														}">O'chirish</button>
                        </div>
                        <div>
                            <button class="roadmap-btn" data-id="${
															project.id || 0
														}" data-name="${
					project.name || 'N/A'
				}">Yo‘l xaritasi</button>
                            <button class="add-task-btn" data-id="${
															project.id || 0
														}">Vazifa qo'shish</button>
                        </div>
                    </div>
                `
				projectsContainer.appendChild(projectCard)
			}

			// Loyiha nomiga click hodisasi (vazifalar.html ga yo‘naltirish)
			document.querySelectorAll('.project-title').forEach(title => {
				title.addEventListener('click', () => {
					const projectId = title.getAttribute('data-id')
					if (projectId) {
						window.location.href = `vazifalar.html?project_id=${projectId}`
					} else {
						console.error('Loyiha ID topilmadi')
					}
				})
			})

			// Tahrirlash tugmalari uchun hodisalar
			document.querySelectorAll('.edit-btn').forEach(button => {
				button.addEventListener('click', async event => {
					currentProjectId = event.target.dataset.id
					if (!currentProjectId || currentProjectId === '0') {
						console.error(
							'currentProjectId aniqlanmadi yoki noto‘g‘ri:',
							currentProjectId
						)
						alert('Loyiha ID topilmadi!')
						return
					}
					try {
						const response = await fetch(
							`http://localhost:5000/api/projects/${currentProjectId}`
						)
						if (!response.ok) {
							const errorText = await response.text()
							throw new Error(
								`Loyiha topilmadi: ${response.status} - ${errorText}`
							)
						}
						const project = await response.json()

						document.getElementById('edit-project-name').value =
							project.name || ''
						document.getElementById('edit-project-description').value =
							project.description || ''
						document.getElementById('edit-start-date').value = project.startDate
							? formatDateForInput(project.startDate)
							: ''
						document.getElementById('edit-end-date').value = project.endDate
							? formatDateForInput(project.endDate)
							: ''
						document.getElementById('edit-status').value =
							project.status || 'rejalashtirilmoqda'
						document.getElementById('edit-statusMasul').value =
							project.responsible || 'J.Xafizov'

						editModal.style.display = 'block'
					} catch (error) {
						console.error('Tahrirlashda xatolik:', error)
						alert('Loyihani yuklashda xatolik yuz berdi: ' + error.message)
					}
				})
			})

			// O‘chirish tugmalari uchun hodisalar
			document.querySelectorAll('.delete-btn').forEach(button => {
				button.addEventListener('click', async event => {
					const projectId = event.target.dataset.id

					// Parol so‘rash
					const password = prompt(
						'Loyihani arxivga o‘tkazish uchun parolni kiriting:'
					)
					if (!password) {
						alert('Parol kiritilmadi!')
						return
					}

					try {
						const response = await fetch(
							`http://localhost:5000/api/projects/archive/${projectId}`,
							{
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: JSON.stringify({ password }),
							}
						)

						if (!response.ok) {
							const errorText = await response.text()
							throw new Error(
								`Arxivga o‘tkazishda xatolik: ${response.status} - ${errorText}`
							)
						}

						const data = await response.json()
						alert(data.message)
						loadProjects() // Sahifani yangilash
					} catch (error) {
						console.error('Arxivga o‘tkazishda xatolik:', error.message)
						alert(
							'Loyihani arxivga o‘tkazishda xatolik yuz berdi: ' + error.message
						)
					}
				})
			})

			// Yo‘l xaritasi tugmalari uchun hodisalar
			document.querySelectorAll('.roadmap-btn').forEach(button => {
				button.addEventListener('click', async () => {
					const projectId = button.dataset.id
					const projectName = button.dataset.name

					// Foydalanuvchi bo‘limini olish
					let department = 'BO‘LIM NOMI' // Default qiymat
					try {
						const response = await fetch(
							'http://localhost:5000/api/user-department'
						)
						if (response.ok) {
							const data = await response.json()
							department = data.department || 'BO‘LIM NOMI'
						} else {
							console.error('Bo‘limni olishda xatolik:', response.status)
						}
					} catch (error) {
						console.error('Bo‘limni olishda xatolik:', error.message)
					}

					const tasks = await getTasksByProject(projectId)
					if (tasks.length === 0) {
						roadmapContent.innerHTML =
							'<p>Ushbu loyiha uchun vazifalar topilmadi.</p>'
						roadmapModal.style.display = 'block'
						return
					}

					let tableHTML = `
						<button class="download-word-btn" data-project-id="${projectId}" data-project-name="${projectName}" data-department="${department}">Word sifatida yuklab olish</button>
						<table class="roadmap-table">
							<thead>
								<tr>
									<th>№</th>
									<th>Chora-tadbirlar nomi</th>
									<th>Amalga oshiriladigan mexanizm</th>
									<th>Ijro muddati</th>
									<th>Ijro uchun mas’ul</th>
								</tr>
							</thead>
							<tbody>
					`

					tasks.forEach((task, index) => {
						tableHTML += `
							<tr data-id="${task.id}">
								<td>${index + 1}</td>
								<td>${task.vazifa_nomi || 'N/A'}</td>
								<td>${task.izoh || 'N/A'}</td>
								<td>${formatDateForDisplay(task.vazifa_tugash_sanasi)}</td>
								<td>${task.vazifa_masul_hodimi || 'N/A'}</td>
							</tr>
						`
					})

					tableHTML += `
							</tbody>
						</table>
					`

					roadmapContent.innerHTML = tableHTML
					roadmapModal.style.display = 'block'

					// Word sifatida yuklab olish tugmasi uchun hodisa
					document.querySelectorAll('.download-word-btn').forEach(btn => {
						btn.addEventListener('click', () => {
							const projectId = btn.dataset.projectId
							const projectName = btn.dataset.projectName
							const department = btn.dataset.department
							const currentTasks = Array.from(
								document.querySelectorAll('.roadmap-table tbody tr')
							).map(row => {
								return {
									vazifa_nomi: row.cells[1].textContent,
									izoh: row.cells[2].textContent,
									vazifa_tugash_sanasi: row.cells[3].textContent,
									vazifa_masul_hodimi: row.cells[4].textContent,
								}
							})
							downloadAsWord(projectName, currentTasks, department)
						})
					})
				})
			})

			// Vazifa qo'shish tugmalari uchun hodisalar
			document.querySelectorAll('.add-task-btn').forEach(button => {
				button.addEventListener('click', () => {
					currentProjectId = button.dataset.id
					document.getElementById('task-name').value = ''
					document.getElementById('task-description').value = ''
					document.getElementById('task-start-date').value = ''
					document.getElementById('task-end-date').value = ''
					document.getElementById('vazifa').value = 'status-tanlash'
					document.getElementById('vazifa-masul-hodim').value = 'masul'
					taskModal.style.display = 'block'
				})
			})

			// Vazifa qo'shish formasi
			taskForm.addEventListener('submit', async event => {
				event.preventDefault()

				const taskData = {
					project_id: currentProjectId,
					vazifa_nomi: document.getElementById('task-name').value,
					izoh: document.getElementById('task-description').value,
					vazifa_boshlanish_sanasi:
						document.getElementById('task-start-date').value,
					vazifa_tugash_sanasi: document.getElementById('task-end-date').value,
					vazifa_status: document.getElementById('vazifa').value.toLowerCase(),
					vazifa_masul_hodimi:
						document.getElementById('vazifa-masul-hodim').value,
				}

				try {
					const response = await fetch('http://localhost:5000/api/vazifalar', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(taskData),
					})

					if (!response.ok) {
						const errorText = await response.text()
						throw new Error(
							`Vazifa qo'shishda xatolik: ${response.status} - ${errorText}`
						)
					}

					const data = await response.json()
					alert(data.message)
					taskModal.style.display = 'none'

					if (currentProjectId) {
						window.location.href = `vazifalar.html?project_id=${currentProjectId}`
					}
				} catch (error) {
					console.error('Vazifa qo`shishda xatolik:', error.message)
					alert('Vazifa qo`shishda xatolik yuz berdi: ' + error.message)
				}
			})
		} catch (error) {
			console.error('Xatolik:', error.message)
			projectsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`
		}
	}

	// Modal elementlarini tekshirish
	if (
		!editModal ||
		!closeModal ||
		!taskModal ||
		!closeTask ||
		!roadmapModal ||
		!closeRoadmap
	) {
		console.error(
			"Modal yoki close tugmasi topilmadi. HTML da 'editModal', 'taskModal' yoki 'roadmapModal' ID lari mavjudligini tekshiring."
		)
		return
	}

	// Edit modalni yopish
	closeModal.addEventListener('click', () => {
		editModal.style.display = 'none'
		console.log('Edit modal close tugmasi orqali yopildi.')
	})

	// Task modalni yopish
	closeTask.addEventListener('click', () => {
		taskModal.style.display = 'none'
		console.log('Task modal close tugmasi orqali yopildi.')
	})

	// Roadmap modalni yopish
	closeRoadmap.addEventListener('click', () => {
		roadmapModal.style.display = 'none'
	})

	// Ikkala modalni tashqarisiga bosilganda yopish
	window.addEventListener('click', event => {
		if (event.target === editModal) {
			editModal.style.display = 'none'
			console.log('Edit modal tashqarisiga bosilgan holda yopildi.')
		}
		if (event.target === taskModal) {
			taskModal.style.display = 'none'
			console.log('Task modal tashqarisiga bosilgan holda yopildi.')
		}
		if (event.target === roadmapModal) {
			roadmapModal.style.display = 'none'
			console.log('Roadmap modal tashqarisiga bosilgan holda yopildi.')
		}
	})

	// Esc tugmasi bosilganda yopish
	document.addEventListener('keydown', event => {
		if (
			event.key === 'Escape' &&
			(editModal.style.display === 'block' ||
				taskModal.style.display === 'block' ||
				roadmapModal.style.display === 'block')
		) {
			editModal.style.display = 'none'
			taskModal.style.display = 'none'
			roadmapModal.style.display = 'none'
			console.log('Esc tugmasi orqali modal yopildi.')
		}
	})

	// Formani saqlash (yangilash)
	editForm.addEventListener('submit', async event => {
		event.preventDefault()

		const updatedProject = {
			name: document.getElementById('edit-project-name').value,
			description: document.getElementById('edit-project-description').value,
			startDate: document.getElementById('edit-start-date').value,
			endDate: document.getElementById('edit-end-date').value,
			status: document.getElementById('edit-status').value,
			responsible: document.getElementById('edit-statusMasul').value,
		}

		try {
			const response = await fetch(
				`http://localhost:5000/api/projects/${currentProjectId}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(updatedProject),
				}
			)

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(
					`Yangilashda xatolik: ${response.status} - ${errorText}`
				)
			}

			const data = await response.json()
			alert(data.message)
			editModal.style.display = 'none'
			loadProjects()
		} catch (error) {
			console.error('Yangilashda xatolik:', error.message)
			alert('Loyihani yangilashda xatolik yuz berdi: ' + error.message)
		}
	})

	// Loyihalarni yuklashni boshlash
	loadProjects()
})
