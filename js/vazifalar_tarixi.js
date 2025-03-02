// document.addEventListener('DOMContentLoaded', () => {
// 	const taskList = document.querySelector('.task-list')
// 	const modal = document.getElementById('task-modal-tarix')
// 	const chatHistory = document.getElementById('chat-history')
// 	const messageInput = document.getElementById('message-input')
// 	const fileUpload = document.getElementById('file-upload')
// 	const userFish = document.getElementById('user-fish')
// 	const closeModalBtn = document.querySelector('.close-modal')
// 	const sendButton = document.querySelector('button[onclick="sendMessage()"]')

// 	// Foydalanuvchi FISH ni login paytida saqlangan userId orqali olish
// 	function getUserFish() {
// 		const userId = sessionStorage.getItem('userId')
// 		if (userId) {
// 			fetch(`http://localhost:5000/api/user/${userId}`)
// 				.then(response => response.json())
// 				.then(data => {
// 					return data.FISH || "Noma'lum"
// 				})
// 				.catch(error => {
// 					console.error('User FISH olishda xatolik:', error)
// 					return "Noma'lum"
// 				})
// 		}
// 		return "Noma'lum" // Agar xatolik bo‘lsa
// 	}

// 	// Modalni ochish va tarixni yuklash
// 	taskList.addEventListener('click', e => {
// 		const task = e.target.closest('.task')
// 		if (task) {
// 			const taskId = task.getAttribute('data-task-id')
// 			modal.style.display = 'block'
// 			loadChatHistory(taskId)
// 			userFish.textContent = getUserFish() // FISH ni ko‘rsatish
// 			task.classList.add('active')
// 		}
// 	})

// 	// Modalni yopish
// 	closeModalBtn.addEventListener('click', () => {
// 		modal.style.display = 'none'
// 		chatHistory.innerHTML = ''
// 		messageInput.value = ''
// 		fileUpload.value = ''
// 		document.querySelector('.task.active')?.classList.remove('active')
// 	})

// 	// Chat tarixini yuklash
// 	function loadChatHistory(taskId) {
// 		fetch(`http://localhost:5000/api/chat-history/${taskId}`)
// 			.then(response => {
// 				if (!response.ok) throw new Error('Server xatosi')
// 				return response.json()
// 			})
// 			.then(data => {
// 				chatHistory.innerHTML = data
// 					.map(
// 						message => `
// 									<p>${message.fish}: ${message.matn || ''} <small>(${message.vaqt})</small>
// 									${
// 										message.file_paths
// 											? '<br>Fayllar: ' +
// 											  JSON.parse(message.file_paths).join(', ')
// 											: ''
// 									}</p>
// 							`
// 					)
// 					.join('')
// 			})
// 			.catch(error => console.error('Tarixni yuklashda xatolik:', error))
// 	}

// 	// Xabar yuborish va bazada saqlash
// 	window.sendMessage = function () {
// 		const taskId = document
// 			.querySelector('.task.active')
// 			?.getAttribute('data-task-id')
// 		const text = messageInput.value.trim()
// 		const files = fileUpload.files
// 		const fish = getUserFish() // User FISH ni olish

// 		if (!taskId) {
// 			alert('Iltimos, biror vazifani tanlang!')
// 			return
// 		}

// 		if (!text && files.length === 0) {
// 			alert('Iltimos, matn yoki fayl yuklang!')
// 			return
// 		}

// 		const formData = new FormData()
// 		formData.append('taskId', taskId)
// 		formData.append('fish', fish)
// 		formData.append('matn', text)
// 		for (let file of files) {
// 			formData.append('files', file)
// 		}

// 		fetch('http://localhost:5000/api/send-message', {
// 			method: 'POST',
// 			body: formData,
// 		})
// 			.then(response => {
// 				if (!response.ok) throw new Error('Yuborishda xatolik')
// 				return response.json()
// 			})
// 			.then(data => {
// 				alert(data.message)
// 				loadChatHistory(taskId) // Yangilangan tarixni yuklash
// 				messageInput.value = ''
// 				fileUpload.value = ''
// 			})
// 			.catch(error => console.error('Xabar yuborishda xatolik:', error))
// 	}
// })
