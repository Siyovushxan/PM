document.addEventListener('DOMContentLoaded', () => {
	const form = document.querySelector('.project-form')
	const profileImage = document.getElementById('profile-image')
	const profileModal = document.getElementById('profile-modal')
	const profileFISH = document.getElementById('profile-fish')
	const profileBulim = document.getElementById('profile-bulim')
	const profileLavozim = document.getElementById('profile-lavozim')
	const logoutLink = document.getElementById('logout-link') // ID orqali aniqlash

	// Foydalanuvchi ID sini login paytida saqlash uchun
	function saveUserId(userId) {
		sessionStorage.setItem('userId', userId) // SessionStorage ga saqlash
	}

	// Foydalanuvchi ID sini olish
	function getUserId() {
		const userId = sessionStorage.getItem('userId')
		console.log('Olingan userId:', userId) // Debugging uchun
		return userId
	}

	// Profilni yangilash (serverdan olish)
	function updateProfile() {
		const userId = getUserId()
		if (userId) {
			fetch(`http://localhost:5000/api/user/${userId}`)
				.then(response => {
					if (!response.ok) {
						throw new Error('Server xatosi: ' + response.status)
					}
					return response.json()
				})
				.then(data => {
					profileFISH.textContent = data.FISH || "Noma'lum"
					profileBulim.textContent = data.Bulim || "Noma'lum"
					profileLavozim.textContent = data.Lavozim || "Noma'lum"
				})
				.catch(error => {
					console.error("Ma'lumot olishda xatolik:", error)
					profileFISH.textContent = "Ma'lumot topilmadi"
					profileBulim.textContent = ''
					profileLavozim.textContent = ''
				})
		} else {
			console.log("User ID topilmadi, login.html ga yo'naltirilyapti...")
			window.location.href = 'login.html'
		}
	}

	// Profil oynasini ochish/yopish
	if (profileImage) {
		profileImage.addEventListener('click', e => {
			e.preventDefault()
			profileModal.style.display =
				profileModal.style.display === 'block' ? 'none' : 'block'
			if (profileModal.style.display === 'block') {
				history.replaceState(null, '', window.location.pathname) // Modal ochilganda qaytishni bloklash
			}
			updateProfile()
		})
	} else {
		console.error('profile-image elementi topilmadi!')
	}

	// Yopish tugmasi
	const closeBtn = document.querySelector('.close-btn')
	if (closeBtn) {
		closeBtn.addEventListener('click', () => {
			profileModal.style.display = 'none'
			history.replaceState(null, '', window.location.pathname) // Yopilganda ham bloklash
		})
	} else {
		console.error('close-btn elementi topilmadi!')
	}

	// Tizimdan chiqish havolasi uchun
	if (logoutLink) {
		logoutLink.addEventListener('click', e => {
			e.preventDefault() // Havola havolasini to‘xtatish
			sessionStorage.removeItem('userId') // Sessiyani tozalash
			history.replaceState(null, '', 'login.html') // Tarixni yangilash
			window.location.href = 'login.html' // Login sahifasiga o‘tish
			history.pushState(null, '', 'login.html') // Login sahifasida ham qaytishni bloklash
		})
	} else {
		console.error('logout-link elementi topilmadi!')
	}

	// Sahifa yuklanganda profilni tekshirish va ortga qaytishni bloklash
	window.onload = () => {
		const userId = getUserId()
		if (!userId) {
			console.log('User ID yo‘q, login.html ga o‘tish...')
			window.location.href = 'login.html'
		} else {
			updateProfile()
			// Faqat index.html va login.html uchun qaytishni bloklash
			if (
				window.location.pathname.includes('index.html') ||
				window.location.pathname.includes('login.html')
			) {
				history.replaceState(null, '', window.location.pathname) // Yuklanganda qaytishni bloklash
			}
		}
	}

	// Ortga qaytishni faqat index.html va login.html uchun bloklash
	window.onpopstate = function (event) {
		const userId = getUserId()
		if (window.location.pathname.includes('index.html') && userId) {
			history.replaceState(null, '', 'index.html')
			return false // Index.html da qaytishni to‘xtatish
		} else if (window.location.pathname.includes('login.html')) {
			history.replaceState(null, '', 'login.html')
			return false // Login.html da qaytishni to‘xtatish
		}
		// Loyihalar.html va vazifalar.html uchun bloklamaydi
	}

	// Loyiha qo‘shish formasi
	if (form) {
		form.addEventListener('submit', async event => {
			event.preventDefault()

			const name = document.getElementById('project-name').value
			const description = document.getElementById('project-description').value
			const startDate = document.getElementById('start-date').value
			const endDate = document.getElementById('end-date').value
			const status = document.getElementById('status').value
			const responsible = document.getElementById('statusMasul').value

			if (
				!name ||
				!description ||
				!startDate ||
				!endDate ||
				!status ||
				!responsible
			) {
				alert('Iltimos, barcha maydonlarni to‘ldiring!')
				return
			}

			const projectData = {
				name,
				description,
				startDate,
				endDate,
				status,
				responsible,
			}

			try {
				const response = await fetch('http://localhost:5000/api/projects', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(projectData),
				})

				const data = await response.json()
				alert(data.message)
				form.reset() // Formani tozalash
			} catch (error) {
				console.error('Xatolik:', error)
				alert('Serverga ulanishda xatolik yuz berdi!')
			}
		})
	} else {
		console.warn('project-form elementi topilmadi! Formani tekshiring.')
	}
})
