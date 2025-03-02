document.addEventListener('DOMContentLoaded', () => {
	const taskList = document.getElementById('task-list')
	const modal = document.getElementById('task-modal-tarix')
	const chatHistory = document.getElementById('chat-history')
	const messageInput = document.getElementById('message-input')
	const fileUpload = document.getElementById('file-upload')
	const userFish = document.getElementById('user-fish')
	const closeModalBtn = document.querySelector('.close-modal')
	const sendButton = document.querySelector('button[onclick="sendMessage()"]')

	let currentTaskId = null // Global taskId ni saqlash
	const currentUserId = sessionStorage.getItem('userId') || '#123524' // Random ID sifatida

	// Vaqtni DD.MM.YYYY HH:mm formatiga o'zgartirish funksiyasi
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

	// Foydalanuvchi FISH ni random ID bilan almashtirish
	function getUserFish() {
		return Promise.resolve(currentUserId) // FISH o'rniga #123524
	}

	// Modalni vazifalar.js dan signal orqali ochish
	if (taskList) {
		taskList.addEventListener('modalOpen', e => {
			currentTaskId = e.taskId // Global o'zgaruvchiga saqlash
			console.log('Modal ochildi, currentTaskId:', currentTaskId) // Debugging
			if (currentTaskId) {
				modal.style.display = 'block'
				loadChatHistory(currentTaskId).then(() =>
					getUserFish().then(fish => {
						userFish.textContent = fish || '#123524'
					})
				)
				const activeRow = taskList.querySelector(
					`tr[data-id="${currentTaskId}"]`
				)
				if (activeRow) activeRow.classList.add('active')
				else console.error('Active row topilmadi:', currentTaskId)
			}
		})
	} else {
		console.error(
			'task-list elementi topilmadi! HTML da "id="task-list"" tekshirilsin.'
		)
	}

	// Modalni yopish
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', () => {
			modal.style.display = 'none'
			document.querySelector('.task.active')?.classList.remove('active')
			currentTaskId = null // Modal yopilganda taskId ni tozalash
		})
	} else {
		console.error('close-modal elementi topilmadi!')
	}

	// Modalni modaldan tashqari yopish (overlay)
	window.addEventListener('click', event => {
		if (event.target === modal) {
			modal.style.display = 'none'
			document.querySelector('.task.active')?.classList.remove('active')
			currentTaskId = null // Modal yopilganda taskId ni tozalash
		}
	})

	// Esc tugmasi bilan yopish
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && modal.style.display === 'block') {
			modal.style.display = 'none'
			document.querySelector('.task.active')?.classList.remove('active')
			currentTaskId = null // Modal yopilganda taskId ni tozalash
		}
	})

	// Chat tarixini yuklash va joylashuvni aniqlash
	function loadChatHistory(taskId) {
		fetch(`http://localhost:5000/api/chat-history/${taskId}`)
			.then(response => {
				if (!response.ok) throw new Error('Server xatosi: ' + response.status)
				return response.json()
			})
			.then(data => {
				console.log('Chat tarixi (xom ma’lumot):', data) // Debugging
				chatHistory.innerHTML =
					data.length > 0
						? data
								.map(message => {
									const isCurrentUser =
										String(message.user_task_id) === currentUserId // String sifatida solishtirish
									console.log('Tekshirish:', {
										messageUserId: message.user_task_id,
										currentUserId,
										isCurrentUser,
										rawMessage: message,
									}) // Debugging
									return `
																<div class="chat-message ${isCurrentUser ? 'right' : 'left'}">
																		<p><strong>${message.fish || "Noma'lum"}</strong>: ${
										message.matn || ''
									} <small>(${formatDateTime(message.vaqt)})</small></p>
																		${
																			message.file_paths
																				? '<br>Fayllar: ' +
																				  JSON.parse(message.file_paths)
																						.map(filePath => {
																							const fileName = filePath
																								.split('/')
																								.pop()
																							const fullUrl = `/uploads/${encodeURIComponent(
																								fileName
																							)}`
																							console.log(
																								"To'liq fayl URL:",
																								fullUrl,
																								"Asl fayl yo'li:",
																								filePath
																							) // Debugging
																							return `<a href="${fullUrl}" download="${fileName}">${fileName}</a>`
																						})
																						.join(', ')
																				: ''
																		}
																</div>
														`
								})
								.join('')
						: '<p>Chat tarixi mavjud emas.</p>'
			})
			.catch(error => {
				console.error('Tarixni yuklashda xatolik:', error)
				chatHistory.innerHTML = '<p>Tarix yuklanmadi: ' + error.message + '</p>'
			})
	}

	// Xabar yuborish va bazada saqlash
	window.sendMessage = function () {
		console.log('Yuborish boshlandi, currentTaskId:', currentTaskId) // Debugging
		const taskId = currentTaskId // Global o'zgaruvchidan olish
		const userId = sessionStorage.getItem('userId') || null
		console.log('Yuborish uchun task_id:', taskId, 'user_task_id:', userId) // Debugging
		const text = messageInput.value.trim()
		const files = fileUpload.files

		if (!taskId) {
			alert('Iltimos, biror vazifani tanlang!')
			return
		}

		if (!userId) {
			alert('Foydalanuvchi ID si topilmadi!')
			return
		}

		if (!text && files.length === 0) {
			alert('Iltimos, matn yoki fayl yuklang!')
			return
		}

		getUserFish().then(fish => {
			const formData = new FormData()
			formData.append('task_id', taskId) // Jadvaldagi task_id
			formData.append('user_task_id', userId) // Jadvaldagi user_task_id
			formData.append('fish', fish)
			formData.append('matn', text)
			for (let file of files) {
				formData.append('files', file)
			}

			// So'rovni tekshirish uchun log
			for (let [key, value] of formData.entries()) {
				console.log(
					'FormData:',
					key + ': ' + (value instanceof File ? value.name : value)
				)
			}

			fetch('http://localhost:5000/api/send-message', {
				method: 'POST',
				body: formData,
			})
				.then(response => {
					if (!response.ok) {
						console.error(
							'Server javobi:',
							response.status,
							response.statusText
						)
						return response.text().then(text => {
							throw new Error(
								'Yuborishda xatolik: ' + response.status + ' - ' + text
							)
						})
					}
					return response.json()
				})
				.then(data => {
					console.log('Yuborish natijasi:', data) // Debugging
					alert(data.message)
					loadChatHistory(taskId) // Yangilangan tarixni modalda ko‘rsatish
					messageInput.value = ''
					fileUpload.value = ''
				})
				.catch(error => {
					console.error('Xabar yuborishda xatolik:', error)
					alert('Xabar yuborishda xatolik: ' + error.message)
				})
		})
	}

	// Modalni yopish funksiyasi (onclick uchun)
	window.closeModal = function () {
		if (closeModalBtn) {
			closeModalBtn.click()
		} else {
			console.error('close-modal elementi topilmadi!')
			modal.style.display = 'none'
			document.querySelector('.task.active')?.classList.remove('active')
			currentTaskId = null // Modal yopilganda taskId ni tozalash
		}
	}
})
