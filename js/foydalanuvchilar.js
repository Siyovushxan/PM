// Elementlarni olish
const addUserTrigger = document.getElementById('addUserTrigger')
const addUserModal = document.getElementById('addUserModal')
const addUserForm = document.getElementById('addUserForm')
const loginInput = document.getElementById('login')
const userTableBody = document.getElementById('userTableBody')
const searchInput = document.getElementById('searchInput')
const bulimSelect = document.getElementById('bulim')
const parentBulimSelect = document.getElementById('parent_bulim')
const editUserModal = document.getElementById('editUserModal')
const editUserForm = document.getElementById('editUserForm')
const resetPasswordBtn = document.getElementById('resetPasswordBtn')
let allUsers = [] // Barcha foydalanuvchilarni saqlash uchun
let allDepartments = [] // Barcha bo‘limlarni saqlash uchun
let allPositions = [] // Barcha lavozimlarni saqlash uchun
let isUsernameAvailable = false // Username mavjudligini kuzatish uchun

// Foydalanuvchi autentifikatsiyasini tekshirish funksiyasi
async function checkAuth() {
	try {
		const response = await fetch('http://localhost:5000/api/check-auth', {
			method: 'GET',
			credentials: 'include', // Cookie yoki tokenlarni yuborish uchun
		})
		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(
				`Autentifikatsiya xatosi: ${response.status} - ${errorText}`
			)
		}
		const data = await response.json()
		if (!data.userId) {
			throw new Error('Foydalanuvchi ID si topilmadi')
		}
		return data
	} catch (error) {
		console.error('Autentifikatsiya tekshirishda xatolik:', error.message)
		throw error
	}
}

// "Hodim ro‘yxatdan o‘tkazish" sarlavhasiga bosilganda modalni ochish
addUserTrigger.addEventListener('click', async () => {
	try {
		await checkAuth()
		addUserModal.style.display = 'block'
		loadDepartments() // Modal ochilganda bo‘limlarni yuklash
	} catch (error) {
		alert('Iltimos, tizimga qayta kiring!')
		window.location.href = 'login.html'
	}
})

// Modalni yopish (Yangi foydalanuvchi qo‘shish uchun)
function closeAddModal() {
	addUserModal.style.display = 'none'
	addUserForm.reset() // Formani tozalash
	isUsernameAvailable = false // Reset qilish
	loginInput.style.borderColor = '' // Border rangini tozalash
	parentBulimSelect.innerHTML =
		'<option value="">Yuqori bo‘limni tanlang (ixtiyoriy)</option>' // Yuqori bo‘limni reset qilish
}

// Modalni yopish (Tahrirlash uchun)
function closeEditModal() {
	editUserModal.style.display = 'none'
	editUserForm.reset() // Formani tozalash
}

// Login inputni tekshirish
loginInput.addEventListener('input', async () => {
	const username = loginInput.value
	if (username.length < 3) {
		loginInput.style.borderColor = 'red'
		isUsernameAvailable = false
		return // Minimal uzunlik tekshiruvi
	}

	try {
		const response = await fetch(`http://localhost:5000/api/users`, {
			credentials: 'include',
		})
		if (!response.ok) {
			throw new Error('Foydalanuvchilar ro‘yxatini olishda xatolik yuz berdi')
		}
		const users = await response.json()
		const exists = users.some(user => user.username === username)
		if (exists) {
			loginInput.style.borderColor = 'red'
			alert('Bu login allaqachon mavjud!')
			isUsernameAvailable = false
		} else {
			loginInput.style.borderColor = 'green'
			isUsernameAvailable = true
		}
	} catch (error) {
		console.error('Login tekshirishda xatolik:', error)
		loginInput.style.borderColor = 'red'
		isUsernameAvailable = false
	}
})

// Bo‘limlarni serverdan yuklash va <select> maydonlarini to‘ldirish
async function loadDepartments() {
	try {
		const response = await fetch('http://localhost:5000/api/departments', {
			credentials: 'include',
		})
		if (!response.ok) {
			throw new Error(
				`Server javobi: ${response.status} - ${await response.text()}`
			)
		}
		allDepartments = await response.json()

		// Add modal uchun Bo‘limni to‘ldirish
		bulimSelect.innerHTML = '<option value="">Bo‘limni tanlang</option>'
		allDepartments.forEach(department => {
			const bulimOption = document.createElement('option')
			bulimOption.value = department.name_uz
			bulimOption.textContent = department.name_uz
			bulimSelect.appendChild(bulimOption)
		})

		// Edit modal uchun Bo‘limni to‘ldirish
		const editBulimSelect = document.getElementById('editBulim')
		editBulimSelect.innerHTML = '<option value="">Bo‘limni tanlang</option>'
		allDepartments.forEach(department => {
			const bulimOption = document.createElement('option')
			bulimOption.value = department.name_uz
			bulimOption.textContent = department.name_uz
			editBulimSelect.appendChild(bulimOption)
		})

		// Yuqori bo‘limlarni to‘ldirish
		populateParentDepartments()

		// Bo‘lim tanlanganda Yuqori bo‘limni yangilash
		bulimSelect.addEventListener('change', updateParentDepartments)
	} catch (error) {
		console.error('Bo‘limlarni yuklashda xatolik:', error)
		alert('Bo‘limlarni yuklashda xatolik yuz berdi: ' + error.message)
	}
}

// Barcha Yuqori bo‘limlarni modal ochilganda to‘ldirish
function populateParentDepartments() {
	parentBulimSelect.innerHTML =
		'<option value="">Yuqori bo‘limni tanlang (ixtiyoriy)</option>'
	const editParentBulimSelect = document.getElementById('editParentBulim')
	editParentBulimSelect.innerHTML =
		'<option value=""> Yuqori turuvchi bo`lim belgilanmagan'

	const uniqueParentIds = [
		...new Set(
			allDepartments
				.map(dept => dept.parent_department_id)
				.filter(id => id !== null)
		),
	]
	uniqueParentIds.forEach(parentId => {
		const parentDept = allDepartments.find(dept => dept.id === parentId)
		if (parentDept) {
			const option = document.createElement('option')
			option.value = parentDept.name_uz
			option.textContent = parentDept.name_uz
			parentBulimSelect.appendChild(option)

			const editOption = document.createElement('option')
			editOption.value = parentDept.name_uz
			editOption.textContent = parentDept.name_uz
			editParentBulimSelect.appendChild(editOption)
		}
	})
}

// Yuqori bo‘limni tanlangan bo‘lim asosida yangilash
function updateParentDepartments() {
	const selectedBulim = bulimSelect.value
	parentBulimSelect.innerHTML =
		'<option value="">Yuqori bo‘limni tanlang (ixtiyoriy)</option>'

	if (!selectedBulim) return

	const selectedDepartment = allDepartments.find(
		dept => dept.name_uz === selectedBulim
	)
	if (!selectedDepartment || !selectedDepartment.parent_department_id) return

	const parentDepartment = allDepartments.find(
		dept => dept.id === selectedDepartment.parent_department_id
	)
	if (parentDepartment) {
		const parentOption = document.createElement('option')
		parentOption.value = parentDepartment.name_uz
		parentOption.textContent = parentDepartment.name_uz
		parentOption.selected = true
		parentBulimSelect.appendChild(parentOption)
	}
}

// Lavozimlarni serverdan yuklash va <select> maydonini to‘ldirish
async function loadPositions() {
	try {
		const response = await fetch('http://localhost:5000/api/positions', {
			credentials: 'include',
		})
		if (!response.ok) {
			throw new Error(
				`Server javobi: ${response.status} - ${await response.text()}`
			)
		}
		allPositions = await response.json()

		const lavozimSelect = document.getElementById('lavozim')
		lavozimSelect.innerHTML = '<option value="">Lavozimni tanlang</option>'
		const editLavozimSelect = document.getElementById('editLavozim')
		editLavozimSelect.innerHTML = '<option value="">Lavozimni tanlang</option>'

		allPositions.forEach(position => {
			const option = document.createElement('option')
			option.value = position.name_uz
			option.textContent = position.name_uz
			lavozimSelect.appendChild(option)

			const editOption = document.createElement('option')
			editOption.value = position.name_uz
			editOption.textContent = position.name_uz
			editLavozimSelect.appendChild(editOption)
		})
	} catch (error) {
		console.error('Lavozimlarni yuklashda xatolik:', error)
		alert('Lavozimlarni yuklashda xatolik yuz berdi: ' + error.message)
	}
}

// Foydalanuvchilarni yuklash va jadvalda ko‘rsatish
async function loadUsers() {
	try {
		await checkAuth() // Autentifikatsiyani tekshirish
		const response = await fetch('http://localhost:5000/api/users', {
			credentials: 'include',
		})
		if (!response.ok) {
			throw new Error(
				`Server javobi: ${response.status} - ${await response.text()}`
			)
		}
		allUsers = await response.json()

		if (!Array.isArray(allUsers)) {
			throw new Error(
				"Serverdan qaytgan ma'lumotlar array emas: " + JSON.stringify(allUsers)
			)
		}

		renderUsers(allUsers)
	} catch (error) {
		console.error('Foydalanuvchilarni yuklashda xatolik:', error)
		alert('Foydalanuvchilarni yuklashda xatolik yuz berdi: ' + error.message)
		window.location.href = 'login.html' // Tizimga qayta kirish uchun yo‘naltirish
	}
}

// Foydalanuvchilarni jadvalda ko‘rsatish funksiyasi
function renderUsers(users) {
	userTableBody.innerHTML = ''

	users.forEach((user, index) => {
		const row = document.createElement('tr')
		const parentBulimText = user.parent_bulim
			? user.parent_bulim
			: "Yuqori turuvchi bo'lim belgilanmagan"
		row.innerHTML = `
            <td>${index + 1}</td>
            <td><a href="javascript:void(0)" class="fish-link" data-id="${
							user.id
						}">${user.fish}</a></td>
            <td>${user.bulim}</td>
            <td>${parentBulimText}</td>
            <td>${user.lavozim}</td>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
            <td>
                <a href="javascript:void(0)" class="delete-btn" data-id="${
									user.id
								}">O‘chirish</a>
            </td>
        `
		userTableBody.appendChild(row)
	})

	addEventListeners()
}

// Qidiruv filtri
searchInput.addEventListener('input', () => {
	const searchTerm = searchInput.value.toLowerCase()
	const filteredUsers = allUsers.filter(user => {
		const parentBulimText = user.parent_bulim
			? user.parent_bulim
			: "Yuqori turuvchi bo'lim belgilanmagan"
		return (
			user.id.toString().includes(searchTerm) ||
			user.fish.toLowerCase().includes(searchTerm) ||
			user.bulim.toLowerCase().includes(searchTerm) ||
			parentBulimText.toLowerCase().includes(searchTerm) ||
			user.lavozim.toLowerCase().includes(searchTerm) ||
			user.username.toLowerCase().includes(searchTerm) ||
			user.role.toLowerCase().includes(searchTerm) ||
			new Date(user.created_at)
				.toLocaleString()
				.toLowerCase()
				.includes(searchTerm)
		)
	})

	renderUsers(filteredUsers)
})

// Hodisalar qo‘shish
function addEventListeners() {
	// O‘chirish tugmasi uchun hodisalar
	document.querySelectorAll('.delete-btn').forEach(button => {
		button.addEventListener('click', async e => {
			const userId = e.target.getAttribute('data-id')
			if (confirm('Foydalanuvchini o‘chirishni tasdiqlaysizmi?')) {
				try {
					await checkAuth() // Autentifikatsiyani tekshirish
					const response = await fetch(
						`http://localhost:5000/api/users/${userId}`,
						{
							method: 'DELETE',
							credentials: 'include',
						}
					)
					const result = await response.json()
					if (response.ok) {
						alert(result.message)
						loadUsers()
					} else {
						throw new Error(result.message || 'O‘chirishda xatolik yuz berdi')
					}
				} catch (error) {
					console.error('O‘chirishda xatolik:', error)
					alert('O‘chirishda xatolik yuz berdi: ' + error.message)
					if (error.message.includes('Autentifikatsiya xatosi')) {
						window.location.href = 'login.html'
					}
				}
			}
		})
	})

	// "F.I.Sh" linki uchun hodisalar
	document.querySelectorAll('.fish-link').forEach(link => {
		link.addEventListener('click', async e => {
			try {
				await checkAuth() // Autentifikatsiyani tekshirish
				const userId = e.target.getAttribute('data-id')
				openEditModal(userId)
			} catch (error) {
				alert('Iltimos, tizimga qayta kiring!')
				window.location.href = 'login.html'
			}
		})
	})
}

// Edit modalni ochish va ma'lumotlarni yuklash
async function openEditModal(userId) {
	const user = allUsers.find(u => u.id == userId)
	if (!user) return

	document.getElementById('editUserId').value = user.id
	document.getElementById('editFish').value = user.fish
	document.getElementById('editBulim').value = user.bulim
	document.getElementById('editParentBulim').value = user.parent_bulim || ''
	document.getElementById('editLavozim').value = user.lavozim
	document.getElementById('editLogin').value = user.username
	document.getElementById('editRole').value = user.role

	editUserModal.style.display = 'block'
}

// Forma yuborilganda (yangi foydalanuvchi qo‘shish uchun)
addUserForm.addEventListener('submit', async e => {
	e.preventDefault()

	if (!isUsernameAvailable) {
		alert('Bu login allaqachon mavjud! Iltimos, boshqa login tanlang.')
		return
	}

	const newUser = {
		fish: document.getElementById('fish').value,
		bulim: document.getElementById('bulim').value,
		parent_bulim: document.getElementById('parent_bulim').value || null,
		lavozim: document.getElementById('lavozim').value,
		login: document.getElementById('login').value,
		password: document.getElementById('password').value,
		role: document.getElementById('role').value,
		created_at: new Date().toISOString(),
	}

	try {
		await checkAuth() // Autentifikatsiyani tekshirish
		const response = await fetch('http://localhost:5000/api/users', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(newUser),
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(
				JSON.parse(errorText).message ||
					'Foydalanuvchi qo‘shishda xatolik yuz berdi'
			)
		}

		const result = await response.json()
		alert('Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tkazildi!')
		closeAddModal()
		loadUsers()
	} catch (error) {
		console.error('Fetch xatolik:', error)
		alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message)
		if (error.message.includes('Autentifikatsiya xatosi')) {
			window.location.href = 'login.html'
		}
	}
})

// Forma yuborilganda (foydalanuvchi ma'lumotlarini tahrirlash uchun)
editUserForm.addEventListener('submit', async e => {
	e.preventDefault()

	const updatedUser = {
		fish: document.getElementById('editFish').value,
		bulim: document.getElementById('editBulim').value,
		parent_bulim: document.getElementById('editParentBulim').value || null,
		lavozim: document.getElementById('editLavozim').value,
		login: document.getElementById('editLogin').value,
		role: document.getElementById('editRole').value,
	}

	const userId = document.getElementById('editUserId').value

	try {
		await checkAuth() // Autentifikatsiyani tekshirish
		const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
			body: JSON.stringify(updatedUser),
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(
				JSON.parse(errorText).message ||
					"Ma'lumotlarni yangilashda xatolik yuz berdi"
			)
		}

		const result = await response.json()
		alert(result.message)
		closeEditModal()
		loadUsers()
	} catch (error) {
		console.error('Fetch xatolik:', error)
		alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message)
		if (error.message.includes('Autentifikatsiya xatosi')) {
			window.location.href = 'login.html'
		}
	}
})

// Parolni qayta tiklash
resetPasswordBtn.addEventListener('click', async () => {
	const newPassword = prompt('Yangi parolni kiriting:')
	if (!newPassword) return

	const userId = document.getElementById('editUserId').value

	try {
		await checkAuth() // Autentifikatsiyani tekshirish
		const response = await fetch(
			`http://localhost:5000/api/users/${userId}/reset-password`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({ newPassword }),
			}
		)

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(
				JSON.parse(errorText).message || 'Parolni tiklashda xatolik yuz berdi'
			)
		}

		const result = await response.json()
		alert(result.message)
	} catch (error) {
		console.error('Fetch xatolik:', error)
		alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message)
		if (error.message.includes('Autentifikatsiya xatosi')) {
			window.location.href = 'login.html'
		}
	}
})

// Sahifa yuklanganda foydalanuvchilarni, bo‘limlarni va lavozimlarni yuklash
document.addEventListener('DOMContentLoaded', async () => {
	try {
		await checkAuth() // Autentifikatsiyani tekshirish
		loadUsers()
		loadDepartments()
		loadPositions()
	} catch (error) {
		alert('Iltimos, tizimga qayta kiring!')
		window.location.href = 'login.html'
	}
})

// Modalni yopish uchun tashqariga bosish
window.onclick = function (event) {
	if (event.target == addUserModal) {
		closeAddModal()
	} else if (event.target == editUserModal) {
		closeEditModal()
	}
}
