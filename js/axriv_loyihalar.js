document.addEventListener('DOMContentLoaded', () => {
	const projectsContainer = document.querySelector('.projects')
	const roadmapModal = document.getElementById('roadmapModal')
	const closeRoadmap = document.querySelector('.close-roadmap')
	const roadmapContent = document.getElementById('roadmap-content')

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

	// Jadvalni Word hujjati sifatida yuklab olish
	function downloadAsWord(projectName, tasks) {
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
													"Navoiyuran" davlat korxonasining 2025 yil uchun mo‘ljallangan <br> <br> RAQAMLASHTIRISH DASTURI
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

	// Arxivlangan loyihalarni yuklash
	async function loadArchivedProjects() {
		try {
			const response = await fetch(
				'http://localhost:5000/api/archived-projects'
			)
			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(
					`Server javobi: ${response.status} - ${response.statusText} - ${errorText}`
				)
			}

			const projects = await response.json()

			if (!projects || projects.length === 0) {
				projectsContainer.innerHTML = "<p>Hozircha arxivlangan loyiha yo'q.</p>"
				return
			}

			projectsContainer.innerHTML = ''
			for (const project of projects) {
				const projectCard = document.createElement('div')
				projectCard.classList.add('project-card')

				projectCard.innerHTML = `
                <h3 class="project-title" data-id="${project.id}">
                    ${
											project.name || 'N/A'
										} <span class="task-hint" style="font-size: 0.8em; color: #777;">- Arxivlangan</span>
                </h3>
                <p class="project-description">${
									project.description || 'N/A'
								}</p>
                <p class="project-dates">Boshlanish: ${formatDate(
									project.startDate
								)} | Tugash: ${formatDate(project.endDate)}</p>
                <p class="project-status">Status: <span class="status">${
									project.status ? project.status.toUpperCase() : 'N/A'
								}</span></p>
                <p class="project-status">Mas'ul hodim: <span class="status">${
									project.responsible || 'N/A'
								}</span></p>
                <div class="bottons">
                    <button class="unarchive-btn" data-id="${
											project.id || 0
										}">Loyihani faollashtirish</button>
                    <button class="roadmap-btn" data-id="${
											project.id || 0
										}" data-name="${
					project.name || 'N/A'
				}">Yo‘l xaritasi</button>
                </div>
            `
				projectsContainer.appendChild(projectCard)

				// Loyiha sarlavhasiga vazifalar sonini qo‘shish
				const tasks = await getTasksByProject(project.id)
				const taskHint = projectCard.querySelector('.task-hint')
				taskHint.textContent = `(${tasks.length} vazifa)`
			}

			// Loyiha nomini bosganda vazifalarni ko‘rish
			document.querySelectorAll('.project-title').forEach(title => {
				title.addEventListener('click', () => {
					const projectId = title.dataset.id
					window.location.href = `vazifalar.html?project_id=${projectId}`
				})
			})

			// Loyihani faollashtirish tugmalari uchun hodisalar
			// Loyihani faollashtirish tugmalari uchun hodisalar
			document.querySelectorAll('.unarchive-btn').forEach(button => {
				button.addEventListener('click', async event => {
					const projectId = event.target.dataset.id

					// Parol so‘rash
					const password = prompt(
						'Loyihani faollashtirish uchun parolni kiriting:'
					)
					if (!password) {
						alert('Parol kiritilmadi!')
						return
					}

					if (
						confirm(
							'Loyihani arxivdan chiqarib, faol holatga qaytarishni tasdiqlaysizmi?'
						)
					) {
						try {
							const response = await fetch(
								`http://localhost:5000/api/projects/unarchive/${projectId}`,
								{
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
									},
									body: JSON.stringify({ password }), // Parolni yuborish
								}
							)

							if (!response.ok) {
								const errorText = await response.json()
								throw new Error(
									errorText.message ||
										'Loyihani faollashtirishda xatolik yuz berdi'
								)
							}

							const data = await response.json()
							alert(data.message)
							loadArchivedProjects() // Sahifani yangilash
						} catch (error) {
							console.error('Loyihani faollashtirishda xatolik:', error.message)
							alert(
								'Loyihani faollashtirishda xatolik yuz berdi: ' + error.message
							)
						}
					}
				})
			})

			// Yo‘l xaritasi tugmalari uchun hodisalar
			document.querySelectorAll('.roadmap-btn').forEach(button => {
				button.addEventListener('click', async () => {
					const projectId = button.dataset.id
					const projectName = button.dataset.name

					const tasks = await getTasksByProject(projectId)
					if (tasks.length === 0) {
						roadmapContent.innerHTML =
							'<p>Ushbu loyiha uchun vazifalar topilmadi.</p>'
						roadmapModal.style.display = 'block'
						return
					}

					let tableHTML = `
                    <button class="download-word-btn" data-project-id="${projectId}" data-project-name="${projectName}">Word sifatida yuklab olish</button>
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
                        <tr>
                            <td>${index + 1}</td>
                            <td>${task.vazifa_nomi || 'N/A'}</td>
                            <td>${task.izoh || 'N/A'}</td>
                            <td>${formatDateForDisplay(
															task.vazifa_tugash_sanasi
														)}</td>
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

					document.querySelectorAll('.download-word-btn').forEach(btn => {
						btn.addEventListener('click', () => {
							const projectId = btn.dataset.projectId
							const projectName = btn.dataset.projectName
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
							downloadAsWord(projectName, currentTasks)
						})
					})
				})
			})
		} catch (error) {
			console.error('Xatolik:', error.message)
			projectsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`
		}
	}

	// Modalni yopish
	closeRoadmap.addEventListener('click', () => {
		roadmapModal.style.display = 'none'
	})

	window.addEventListener('click', event => {
		if (event.target === roadmapModal) {
			roadmapModal.style.display = 'none'
		}
	})

	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && roadmapModal.style.display === 'block') {
			roadmapModal.style.display = 'none'
		}
	})

	// Arxivlangan loyihalarni yuklashni boshlash
	loadArchivedProjects()
})
