document.addEventListener('DOMContentLoaded', () => {
	const taskList = document.getElementById('task-list')
	const editTaskModal = document.getElementById('editTaskModal')
	const editTaskForm = document.getElementById('edit-task-form')
	const closeTaskEdit = document.querySelector('.close-task-edit')

	let currentTaskId = null

	// URL dan project_id ni olish
	const urlParams = new URLSearchParams(window.location.search)
	const projectId = urlParams.get('project_id')

	// Sana formatini o‘zgartirish
	function formatDate(dateString) {
		if (!dateString) return 'N/A'
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return 'N/A'
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}.${month}.${year}`
	}

	// Sanani input uchun formatga aylantirish
	function formatDateForInput(dateString) {
		if (!dateString) return ''
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return ''
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// Loyiha nomini olish
	async function getProjectName(projectId) {
		try {
			const response = await fetch(
				`http://localhost:5000/api/projects/${projectId}`
			)
			if (!response.ok) {
				const errorText = await response.text()
				console.warn(
					`Loyiha ma’lumotlari yuklanmadi: ${response.status} - ${errorText}`
				)
				return 'Noma’lum loyiha'
			}
			const project = await response.json()
			return project.name || 'Noma’lum loyiha'
		} catch (error) {
			console.error('Loyiha nomini olishda xatolik:', error)
			return 'Noma’lum loyiha'
		}
	}

	// Vazifa ma’lumotlarini olish (asosiy + detallar)
	async function getTaskDetails(taskId) {
		try {
			const [basicDetails, rightDetails] = await Promise.all([
				fetch(`http://localhost:5000/api/vazifalar/${taskId}`).then(res =>
					res.json()
				),
				fetch(
					`http://localhost:5000/api/vazifalar-details-right/${taskId}`
				).then(res => res.json()),
			])
			console.log('Vazifa ma’lumotlari (birlashtirilgan):', {
				...basicDetails,
				...rightDetails,
			})
			return { ...basicDetails, ...rightDetails } // Ikkala javobni birlashtiramiz
		} catch (error) {
			console.error('Vazifa ma’lumotlarini olishda xatolik:', error)
			return null
		}
	}

	// Vazifa yangilash
	async function updateTask(taskId, taskData) {
		try {
			const response = await fetch(
				`http://localhost:5000/api/vazifalar/${taskId}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(taskData),
				}
			)
			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(
					`Vazifa yangilashda xatolik: ${response.status} - ${errorText}`
				)
			}
			return await response.json()
		} catch (error) {
			console.error('Vazifa yangilashda xatolik:', error)
			return null
		}
	}

	// Vazifalarni yuklash
	async function loadTasks(index = 1) {
		if (!projectId) {
			taskList.innerHTML = '<p>Loyiha ID topilmadi.</p>'
			return
		}

		try {
			const projectName = await getProjectName(projectId)
			const response = await fetch(
				`http://localhost:5000/api/vazifalar?project_id=${projectId}`
			)
			if (!response.ok) {
				const errorText = await response.text()
				console.error(`Vazifalar yuklanmadi: ${response.status} - ${errorText}`)
				taskList.innerHTML = `<p>Vazifalar yuklanmadi: ${errorText}</p>`
				return
			}
			const tasks = await response.json()
			console.log('Vazifalar:', tasks)
			taskList.innerHTML = `
							<h3 style="text-align: center; margin-bottom: 20px; color: #2c3e50; font-size: 1.5em;">${projectName} loyihasiga tegishli vazifalar ro'yxati</h3>
							<h4 style="text-align: center; margin-bottom: 1rem">Vazifalar tarixini ko'rish uchun vazifa nomini bosing!</h4>
							${
								tasks.length > 0
									? `
													<table class="task-table">
															<thead>
																	<tr>
																			<th>id</th>
																			<th>Vazifa nomi</th>
																			<th>Izoh</th>
																			<th>Boshlanish sanasi</th>
																			<th>Tugash sanasi</th>
																			<th>Status</th>
																			<th>Mas'ul hodim</th>
																			<th>Amallar</th>
																	</tr>
															</thead>
															<tbody>
																	${tasks
																		.map(
																			task => `
																			<tr class="task-row" data-id="${task.id || ''}">
																					<td>${index++}</td>
																					<td class="task-name" data-task-id="${task.id}">${
																				task.vazifa_nomi || 'N/A'
																			}</td>
																					<td>${task.izoh || 'N/A'}</td>
																					<td>${formatDate(task.vazifa_boshlanish_sanasi) || 'N/A'}</td>
																					<td>${formatDate(task.vazifa_tugash_sanasi) || 'N/A'}</td>
																					<td>${task.vazifa_status || 'N/A'}</td>
																					<td>${task.vazifa_masul_hodimi || 'N/A'}</td>
																					<td>
																							<span class="edit-task-icon" style="cursor: pointer; color: #3498db;">✎</span>
																					</td>
																			</tr>
																	`
																		)
																		.join('')}
															</tbody>
													</table>
											`
									: "<p>Bu loyiha uchun vazifa yo'q.</p>"
							}
					`

			// Tahrirlash iconiga hodisa
			document.querySelectorAll('.edit-task-icon').forEach(icon => {
				icon.addEventListener('click', async e => {
					e.stopPropagation()
					currentTaskId = icon.closest('tr').getAttribute('data-id')
					console.log('Tahrirlash uchun ID:', currentTaskId)
					if (!currentTaskId) {
						console.error('ID topilmadi!')
						alert('Vazifa ID si topilmadi!')
						return
					}
					const task = await getTaskDetails(currentTaskId)
					if (task) {
						console.log('Vazifa ma’lumotlari (to‘liq):', task)
						document.getElementById('edit-task-id').value = task.id || ''
						document.getElementById('edit-task-name').value =
							task.vazifa_nomi || task.name || ''
						document.getElementById('edit-task-description').value =
							task.izoh || task.description || ''
						document.getElementById('edit-task-start-date').value =
							task.vazifa_boshlanish_sanasi || task.start_date
								? formatDateForInput(
										task.vazifa_boshlanish_sanasi || task.start_date
								  )
								: ''
						document.getElementById('edit-task-end-date').value =
							task.vazifa_tugash_sanasi || task.end_date
								? formatDateForInput(task.vazifa_tugash_sanasi || task.end_date)
								: ''
						document.getElementById('edit-task-status').value =
							task.vazifa_status || task.status || 'rejalashtirilmoqda'
						document.getElementById('edit-task-responsible').value =
							task.vazifa_masul_hodimi || task.responsible || ''
						editTaskModal.style.display = 'block'
					} else {
						alert('Vazifa ma’lumotlari topilmadi yoki server xatosi!')
					}
				})
			})

			// Vazifa nomiga bosilganda modal ochish
			document.querySelectorAll('.task-name').forEach(taskName => {
				taskName.addEventListener('click', e => {
					e.stopPropagation()
					const taskId = taskName.getAttribute('data-task-id')
					if (taskId) {
						const taskRow = taskName.closest('tr')
						if (taskRow) {
							taskRow.classList.add('active')
							const modalEvent = new Event('modalOpen')
							modalEvent.taskId = taskId
							taskList.dispatchEvent(modalEvent)
							console.log('Modal ochish uchun task_id:', taskId)
						} else {
							console.error('Task row topilmadi:', taskId)
						}
					}
				})
			})
		} catch (error) {
			console.error('Vazifalarni yuklashda xatolik:', error)
			taskList.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`
		}
	}

	// Edit modalni yopish
	closeTaskEdit.addEventListener('click', () => {
		editTaskModal.style.display = 'none'
	})

	// Edit modalni tashqari yopish
	window.addEventListener('click', event => {
		if (event.target === editTaskModal) {
			editTaskModal.style.display = 'none'
		}
	})

	// Esc bilan edit modalni yopish
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && editTaskModal.style.display === 'block') {
			editTaskModal.style.display = 'none'
		}
	})

	// Vazifa tahrirlash formasi
	editTaskForm.addEventListener('submit', async event => {
		event.preventDefault()

		const taskData = {
			vazifa_nomi: document.getElementById('edit-task-name').value,
			izoh: document.getElementById('edit-task-description').value,
			vazifa_boshlanish_sanasi: document.getElementById('edit-task-start-date')
				.value,
			vazifa_tugash_sanasi: document.getElementById('edit-task-end-date').value,
			vazifa_status: document.getElementById('edit-task-status').value,
			vazifa_masul_hodimi: document.getElementById('edit-task-responsible')
				.value,
		}

		try {
			const result = await updateTask(currentTaskId, taskData)
			if (result && result.message === 'Vazifa muvaffaqiyatli yangilandi') {
				alert('Vazifa muvaffaqiyatli yangilandi!')
				editTaskModal.style.display = 'none'
				loadTasks() // Sahifani yangilash
			} else {
				alert('Vazifa yangilashda muammolar yuz berdi!')
			}
		} catch (error) {
			console.error('Vazifa yangilashda xatolik:', error)
			alert('Vazifa yangilashda xatolik yuz berdi: ' + error.message)
		}
	})

	// Vazifalarni yuklashni boshlash
	loadTasks()
})
