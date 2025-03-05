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
	let currentUserId = sessionStorage.getItem('userId') // Sessiondan foydalanuvchi ID si

	// Login holatini tekshirish
	if (!currentUserId) {
		console.warn('Sessiondan userId topilmadi, login tekshiruvi boshlanadi...')
		fetch(`${serverUrl}/api/check-session`, {
			method: 'GET',
			credentials: 'include',
		})
			.then(res => {
				if (!res.ok) throw new Error('Session tekshiruvi xatolik')
				return res.json()
			})
			.then(data => {
				if (data.userId) {
					currentUserId = data.userId
					sessionStorage.setItem('userId', currentUserId)
					console.log(
						'Session tekshiruvi muvaffaqiyatli, Joriy foydalanuvchi ID:',
						currentUserId
					)
				} else {
					console.warn('Foydalanuvchi tizimga kirmagan!')
					alert('Iltimos, avval tizimga kiring!')
					window.location.href = '/login.html'
					return
				}
			})
			.catch(error => {
				console.error('Session tekshiruvi xatoligi:', error)
				alert('Iltimos, avval tizimga kiring!')
				window.location.href = '/login.html'
				return
			})
	} else {
		console.log('Joriy foydalanuvchi ID (session):', currentUserId)
	}

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
		if (!currentUserId) {
			console.error('Foydalanuvchi ID si mavjud emas, modal ochilmadi!')
			alert('Iltimos, avval tizimga kiring!')
			window.location.href = '/login.html'
			return
		}

		console.log(
			'Modal ochishga harakat qilinyapti, taskId:',
			taskId,
			'Modal:',
			modal,
			'User ID:',
			currentUserId
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
					console.log("Vazifa ma'lumotlari (JSON):", data)
					return data
				})
				.catch(error => {
					console.error("Vazifa ma'lumotlarini olishda xatolik:", error)
					return {
						id: taskId,
						name: "Noma'lum vazifa",
						description: 'Izoh mavjud emas',
					}
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
					}
				}),
		])
			.then(([basicDetails, rightDetails]) => {
				console.log(
					"Asosiy ma'lumotlar:",
					basicDetails,
					"O'ng tomon ma'lumotlari:",
					rightDetails
				)
				taskName.textContent = `${
					basicDetails.name || basicDetails.vazifa_nomi || "Noma'lum vazifa"
				}`
				taskId.textContent = `Vazifa raqami: ${
					basicDetails.id !== null && basicDetails.id !== undefined
						? basicDetails.id.toString()
						: "Noma'lum"
				}`
				taskDescription.textContent = `IZOH: ${
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

		// Chat tarixini va natijani yuklash
		fetch(`${serverUrl}/api/chat-history/${taskId}`)
			.then(res => {
				console.log(
					`Chat tarixi so'rov: ${serverUrl}/api/chat-history/${taskId}, Status: ${res.status}`
				)
				if (!res.ok) throw new Error(`HTTP xatolik: ${res.status}`)
				return res.json()
			})
			.then(chatData => {
				console.log("Chat ma'lumotlari:", chatData)
				// Hamma xabarlar chat tarixida ko'rinadi, shu jumladan natijalar
				taskHistory.innerHTML =
					chatData.length > 0
						? chatData
								.map(message => {
									const isCurrentUser =
										message.user_task_id.toString() === currentUserId.toString()
									const isResult = message.is_result === 1
									const messageContent = `
											<div class="chat-message ${isCurrentUser ? 'right' : 'left'} ${
										isResult ? 'result-message' : ''
									}">
													<p><strong>${isResult ? 'Natija:' : ''}${
										message.fish || "Noma'lum"
									}</strong>: <br> ${message.matn || ''} <small>(${
										formatDateTime(message.vaqt) || 'N/A'
									})</small></p>
													${
														message.file_paths
															? `<p>Fayllar: ${message.file_paths
																	.split(',')
																	.map(
																		file => `
															<a href="${serverUrl}/uploads/${file.trim()}" download="${file.trim()}">${file.trim()}</a>`
																	)
																	.join(', ')}</p>`
															: ''
													}
											</div>
									`
									return messageContent
								})
								.join('')
						: '<p>Chat tarixi mavjud emas.</p>'

				// Faqat natijalar Natija bo'limida ko'rinadi
				const resultMessages = chatData.filter(
					message => message.is_result === 1
				)
				taskResult.innerHTML =
					resultMessages.length > 0
						? resultMessages
								.map(message => {
									const isCurrentUser =
										message.user_task_id.toString() === currentUserId.toString()
									return `
											<div class="chat-message ${isCurrentUser ? 'right' : 'left'} result-message chat-tarix-natija-ijobiy">
                                            <p> <strong>${message.fish || "Noma'lum"}</strong>: ${
										message.matn || ''
									} <small>(${
										formatDateTime(message.vaqt) || 'N/A'
									})</small></p>
													${
														message.file_paths
															? `<p>Fayllar: ${message.file_paths
																	.split(',')
																	.map(
																		file => `
															<a href="${serverUrl}/uploads/${file.trim()}" download="${file.trim()}">${file.trim()}</a>`
																	)
																	.join(', ')}</p>`
															: ''
													}
											</div>
									`
								})
								.join('')
						: '<p>Natija mavjud emas.</p>'
			})
			.catch(error => console.error('Chat tarixi yuklashda xatolik:', error))
	}

	// Xabar yuborish funksiyasi
	window.sendMessage = function () {
		if (!currentTaskId) {
			alert('Iltimos, vazifani tanlang!')
			return
		}
		if (!currentUserId) {
			alert('Iltimos, avval tizimga kiring!')
			window.location.href = '/login.html'
			return
		}

		const text = messageInput.value.trim()
		const files = fileUpload.files
		const isResult = resultCheckbox.checked ? 1 : 0 // Ijobiy natija statusi

		// Matn yoki fayl kamida biri bo'lishi kerak
		if (!text && files.length === 0) {
			alert('Iltimos, matn yoki fayl kiriting!')
			return
		}

		const formData = new FormData()
		formData.append('task_id', currentTaskId)
		formData.append('user_task_id', currentUserId) // Son sifatida
		formData.append('is_result', isResult) // Ijobiy natija qo'shildi

		// Foydalanuvchi nomini serverdan olish
		fetch(`${serverUrl}/api/user/${currentUserId}`)
			.then(res => res.json())
			.then(userData => {
				const fish = userData.FISH || "Noma'lum"
				formData.append('fish', fish)
				formData.append('matn', text || '') // Matn bo'sh bo'lsa ham yuborilsin

				// Fayllarni qo'shish
				if (files.length > 0) {
					for (let file of files) {
						formData.append('file_paths', file) // Fayllarni original shaklda yuborish
						console.log('Yuborilayotgan fayl:', file.name) // Debugging
					}
				}

				console.log("Yuborilayotgan ma'lumotlar (Client):", {
					task_id: currentTaskId,
					user_task_id: currentUserId,
					fish: fish,
					matn: text,
					is_result: isResult,
					file_count: files.length,
					files: files.length > 0 ? Array.from(files).map(f => f.name) : 'None',
				})

				fetch(`${serverUrl}/api/chat-history`, {
					method: 'POST',
					body: formData,
				})
					.then(response => {
						console.log(
							`Xabar yuborish javobi: Status ${response.status}, Text: ${response.statusText}`
						)
						if (!response.ok) {
							throw new Error(
								`HTTP xatolik: ${response.status} - ${response.statusText}`
							)
						}
						return response.json()
					})
					.then(data => {
						console.log('Xabar yuborildi:', data)
						alert(data.message || 'Xabar muvaffaqiyatli yuborildi!')
						messageInput.value = ''
						fileUpload.value = ''
						resultCheckbox.checked = false // Checkboxni tozalash
						openModal(currentTaskId) // Chat va natija yangilanishi
					})
					.catch(error => {
						console.error('Xabar yuborishda xatolik:', error.message)
						alert('Xabar yuborishda xatolik yuz berdi: ' + error.message)
						openModal(currentTaskId) // Xatolik bo'lsa ham yangilash
					})
			})
			.catch(error => {
				console.error("Foydalanuvchi ma'lumotlarini olishda xatolik:", error)
				alert("Foydalanuvchi ma'lumotlari olishda xatolik: " + error.message)
				formData.append('fish', "Noma'lum")
				formData.append('is_result', isResult)
				fetch(`${serverUrl}/api/chat-history`, {
					method: 'POST',
					body: formData,
				})
					.then(response => {
						console.log(
							`Xabar yuborish javobi: Status ${response.status}, Text: ${response.statusText}`
						)
						if (!response.ok) {
							throw new Error(
								`HTTP xatolik: ${response.status} - ${response.statusText}`
							)
						}
						return response.json()
					})
					.then(data => {
						console.log('Xabar yuborildi:', data)
						alert(data.message || 'Xabar muvaffaqiyatli yuborildi!')
						messageInput.value = ''
						fileUpload.value = ''
						resultCheckbox.checked = false // Checkboxni tozalash
						openModal(currentTaskId) // Chat va natija yangilanishi
					})
					.catch(error => {
						console.error('Xabar yuborishda xatolik:', error.message)
						alert('Xabar yuborishda xatolik yuz berdi: ' + error.message)
						openModal(currentTaskId) // Xatolik bo'lsa ham yangilash
					})
			})
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