document.addEventListener('DOMContentLoaded', () => {
	const projectsContainer = document.querySelector('.projects')
	const editModal = document.getElementById('editModal')
	const editForm = document.getElementById('edit-form')
	const closeModal = document.querySelector('.close')
	const taskModal = document.getElementById('taskModal')
	const taskForm = document.getElementById('task-form')
	const closeTask = document.querySelector('.close-task')

	let currentProjectId = null

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
		const differenceDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1 // +1 qo'shiladi, kunlar to'liq hisoblanadi
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
			projects.forEach(project => {
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
                            <button class="add-task-btn" data-id="${
															project.id || 0
														}">Vazifa qo'shish</button>
                        </div>
                    </div>
                `
				projectsContainer.appendChild(projectCard)
			})

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
							project.responsible ||
							(project.responsible ? project.responsible : 'J.Xafizov')

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
					if (confirm('Loyihani o‘chirishni istaysizmi?')) {
						try {
							const response = await fetch(
								`http://localhost:5000/api/projects/${projectId}`,
								{
									method: 'DELETE',
								}
							)

							if (!response.ok) {
								const errorText = await response.text()
								throw new Error(
									`O‘chirishda xatolik: ${response.status} - ${errorText}`
								)
							}

							const data = await response.json()
							alert(data.message)
							loadProjects() // Loyihalar ro‘yxatini yangilash
						} catch (error) {
							console.error('O‘chirishda xatolik:', error.message)
							alert('Loyihani o‘chirishda xatolik yuz berdi: ' + error.message)
						}
					}
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
					vazifa_status: document.getElementById('vazifa').value,
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
					loadProjects() // Loyihalarni qayta yuklash
				} catch (error) {
					console.error("Vazifa qo'shishda xatolik:", error.message)
					alert("Vazifa qo'shishda xatolik yuz berdi: " + error.message)
				}
			})
		} catch (error) {
			console.error('Xatolik:', error.message)
			projectsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`
		}
	}

	// Modal elementlarini tekshirish
	if (!editModal || !closeModal || !taskModal || !closeTask) {
		console.error(
			"Modal yoki close tugmasi topilmadi. HTML da 'editModal' yoki 'taskModal' ID lari mavjudligini tekshiring."
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
	})

	// Esc tugmasi bosilganda yopish
	document.addEventListener('keydown', event => {
		if (
			event.key === 'Escape' &&
			(editModal.style.display === 'block' ||
				taskModal.style.display === 'block')
		) {
			editModal.style.display = 'none'
			taskModal.style.display = 'none'
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
