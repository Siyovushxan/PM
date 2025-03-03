document.addEventListener('DOMContentLoaded', () => {
	const taskList = document.getElementById('task-list')
	const modal = document.getElementById('task-modal')
	const taskName = document.getElementById('task-name')
	const taskId = document.getElementById('task-id')
	const taskDescription = document.getElementById('task-description')
	const taskResult = document.getElementById('task-result')
	const taskHistory = document.getElementById('task-history')
	const taskDetails = document.getElementById('task-details')
	const responsible = document.getElementById('responsible')
	const startDate = document.getElementById('start-date')
	const endDate = document.getElementById('end-date')
	const daysDiff = document.getElementById('days-diff')
	const creator = document.getElementById('creator')
	const messageInput = document.getElementById('message-input')
	const fileUpload = document.getElementById('file-upload')
	const resultCheckbox = document.getElementById('result-checkbox')
	const closeModalBtn = document.querySelector('.close-modal')

	let currentTaskId = null
	const serverUrl = 'http://localhost:5000'
	const currentUserId = sessionStorage.getItem('userId') // Sessiondan foydalanuvchi ID si

	console.log('Joriy foydalanuvchi ID (session):', currentUserId) // Debugging

	// Elementlarni tekshirish
	console.log('Elementlar tekshiruvi:', {
		taskList: !!taskList,
		modal: !!modal,
		taskName: !!taskName,
		taskId: !!taskId,
		taskDescription: !!taskDescription,
		taskResult: !!taskResult,
		taskHistory: !!taskHistory,
		taskDetails: !!taskDetails,
		responsible: !!responsible,
		startDate: !!startDate,
		endDate: !!endDate,
		daysDiff: !!daysDiff,
		creator: !!creator,
		messageInput: !!messageInput,
		fileUpload: !!fileUpload,
		resultCheckbox: !!resultCheckbox,
		closeModalBtn: !!closeModalBtn,
	})

	// Modal ochish funksiyasi
	function openModal(taskId) {
		console.log(
			'Modal ochishga harakat qilinyapti, taskId:',
			taskId,
			'Modal:',
			modal
		)
		if (!modal) {
			console.error(
				'Modal elementi topilmadi! HTML da "id="task-modal"" tekshirilsin'
			)
			return
		}
		if (!taskId) {
			console.error('taskId topilmadi!')
			return
		}

		currentTaskId = taskId
		modal.classList.add('modal-open')
		modal.style.display = 'block'

		// Ma'lumotlarni yuklash
		Promise.all([
			fetch(`${serverUrl}/api/vazifalar/${taskId}`)
				.then(res => {
					console.log(
						`Vazifa ma'lumotlari so'rov: ${serverUrl}/api/vazifalar/${taskId}, Status: ${res.status}`
					)
					if (!res.ok) throw new Error(`HTTP xatolik: ${res.status}`)
					return res.json()
				})
				.then(data => {
					console.log("Vazifa ma'lumotlari (JSON):", data) // Debugging
					return data
				})
				.catch(error => {
					console.error("Vazifa ma'lumotlarini olishda xatolik:", error)
					return {
						id: taskId,
						name: "Noma'lum vazifa",
						description: 'Izoh mavjud emas',
					} // Defolt qiymat
				}),
			fetch(`${serverUrl}/api/vazifalar-details-right/${taskId}`)
				.then(res => {
					console.log(
						`Detallar so'rov: ${serverUrl}/api/vazifalar-details-right/${taskId}, Status: ${res.status}`
					)
					if (!res.ok) throw new Error(`HTTP xatolik: ${res.status}`)
					return res.json()
				})
				.catch(error => {
					console.error('Detallar olishda xatolik:', error)
					return {
						responsible: "Noma'lum",
						start_date: null,
						end_date: null,
						status: "Noma'lum",
					} // Defolt qiymat
				}),
		])
			.then(([basicDetails, rightDetails]) => {
				console.log(
					"Asosiy ma'lumotlar:",
					basicDetails,
					"O'ng tomon ma'lumotlari:",
					rightDetails
				)
				// Ma'lumotlarni to'g'ri yuklash
				taskName.textContent = `Vazifa nomi: ${
					basicDetails.name || basicDetails.vazifa_nomi || "Noma'lum vazifa"
				}`
				taskId.textContent = `Vazifa raqami: ${
					basicDetails.id !== null && basicDetails.id !== undefined
						? basicDetails.id.toString()
						: "Noma'lum"
				}` // ID ni string sifatida yuklash
				taskDescription.textContent = `Vazifa izohi: ${
					basicDetails.description || basicDetails.izoh || 'Izoh mavjud emas'
				}`
				responsible.textContent = rightDetails.responsible || "Noma'lum"
				startDate.textContent = formatDateTime(rightDetails.start_date) || 'N/A'
				endDate.textContent = formatDateTime(rightDetails.end_date) || 'N/A'
				daysDiff.textContent =
					calculateDaysDiff(rightDetails.start_date, rightDetails.end_date) ||
					'0'
				const urlParams = new URLSearchParams(window.location.search)
				const projectId = urlParams.get('project_id')
				fetch(`${serverUrl}/api/projects/${projectId}`)
					.then(res => res.json())
					.then(project => {
						creator.textContent = project.responsible || "Noma'lum"
					})
					.catch(error =>
						console.error("Loyiha ma'lumotlarini olishda xatolik:", error)
					)
			})
			.catch(error =>
				console.error("Ma'lumot yuklashda umumiy xatolik:", error)
			)

		// Chat tarixini yuklash
		fetch(`${serverUrl}/api/chat-history/${taskId}`)
			.then(res => {
				console.log(
					`Chat tarixi so'rov: ${serverUrl}/api/chat-history/${taskId}, Status: ${res.status}`
				)
				if (!res.ok) throw new Error(`HTTP xatolik: ${res.status}`)
				return res.json()
			})
			.then(chatData => {
				console.log("Chat ma'lumotlari:", chatData) // Debugging
				taskHistory.innerHTML =
					chatData.length > 0
						? chatData
								.map(message => {
									const isCurrentUser = message.user_task_id === currentUserId
									console.log(
										`Xabar: ${message.matn}, Foydalanuvchi: ${
											message.user_task_id
										}, Joriy: ${currentUserId}, Chap/O‘ng: ${
											isCurrentUser ? 'right' : 'left'
										}`
									)
									return `
                            <div class="chat-message ${
															isCurrentUser ? 'right' : 'left'
														}">
                                <p><strong>${
																	message.fish || "Noma'lum"
																}</strong>: ${message.matn || ''} <small>(${
										formatDateTime(message.vaqt) || 'N/A'
									})</small></p>
                                ${
																	message.file_paths
																		? `<p>Fayllar: ${message.file_paths
																				.split(',')
																				.map(
																					file =>
																						`<a href="${serverUrl}/uploads/${file.trim()}" download="${file.trim()}">${file.trim()}</a>`
																				)
																				.join(', ')}</p>`
																		: ''
																}
                            </div>
                        `
								})
								.join('')
						: '<p>Chat tarixi mavjud emas.</p>'
			})
			.catch(error => console.error('Chat tarixi yuklashda xatolik:', error))
	}

	// Xabar yuborish funksiyasi
	window.sendMessage = function () {
		if (!currentTaskId) {
			alert('Iltimos, vazifani tanlang!')
			return
		}

		const text = messageInput.value.trim()
		const files = fileUpload.files
		if (!text && files.length === 0) {
			alert('Matn yoki fayl kiritish kerak!')
			return
		}

		const formData = new FormData()
		formData.append('task_id', currentTaskId)
		formData.append('user_task_id', currentUserId)
		formData.append('fish', 'Foydalanuvchi') // Sessiondan foydalanuvchi nomini olish kerak
		formData.append('matn', text)
		for (let file of files) {
			formData.append('file_paths', file)
		}

		fetch(`${serverUrl}/api/chat-history`, {
			method: 'POST',
			body: formData,
		})
			.then(response => response.json())
			.then(data => {
				console.log('Xabar yuborildi:', data)
				alert(data.message || 'Xabar muvaffaqiyatli yuborildi!')
				messageInput.value = ''
				fileUpload.value = ''
				openModal(currentTaskId) // Chat tarixini yangilash
			})
			.catch(error => console.error('Xabar yuborishda xatolik:', error))
	}

	// modalOpen hodisasini qabul qilish
	if (taskList) {
		taskList.addEventListener('modalOpen', event => {
			const taskId = event.taskId
			console.log('Modal ochish signali qabul qilindi, taskId:', taskId)
			if (taskId) {
				openModal(taskId)
			} else {
				console.error('taskId topilmadi hodisada:', event)
			}
		})
	} else {
		console.error('taskList elementi topilmadi!')
	}

	// Modalni yopish (x tugmasi)
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', () => {
			if (modal) {
				modal.classList.remove('modal-open')
				modal.style.display = 'none'
				if (currentTaskId) {
					const activeRow = taskList.querySelector(
						`tr[data-id="${currentTaskId}"]`
					)
					activeRow?.classList.remove('active')
				}
				currentTaskId = null
			}
		})
	} else {
		console.error('close-modal elementi topilmadi!')
	}

	// Modalni yopish (tashqari bosish)
	window.addEventListener('click', event => {
		if (modal && !modal.contains(event.target)) {
			console.log('Modal tashqarisiga bosildi, yopilyapti...')
			modal.classList.remove('modal-open')
			modal.style.display = 'none'
			if (currentTaskId && taskList) {
				const activeRow = taskList.querySelector(
					`tr[data-id="${currentTaskId}"]`
				)
				activeRow?.classList.remove('active')
			}
			currentTaskId = null
		}
	})

	// Modalni yopish (Esc tugmasi)
	document.addEventListener('keydown', event => {
		if (
			event.key === 'Escape' &&
			modal &&
			modal.classList.contains('modal-open')
		) {
			modal.classList.remove('modal-open')
			modal.style.display = 'none'
			if (currentTaskId) {
				const activeRow = taskList.querySelector(
					`tr[data-id="${currentTaskId}"]`
				)
				activeRow?.classList.remove('active')
			}
			currentTaskId = null
		}
	})

	// Yordamchi funksiyalar
	function formatDateTime(dateString) {
		if (!dateString) return 'N/A'
		const date = new Date(dateString)
		if (isNaN(date.getTime())) return 'N/A'
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${day}.${month}.${year} ${hours}:${minutes}`
	}

	function calculateDaysDiff(startDate, endDate) {
		if (!startDate || !endDate) return 0
		const start = new Date(startDate)
		const end = new Date(endDate)
		const diffTime = Math.abs(end - start)
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
	}
})
