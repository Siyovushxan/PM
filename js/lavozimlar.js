// Barcha lavozimlarni saqlash uchun global o‘zgaruvchi
let allPositions = []

// Lavozimlarni serverdan olish va jadvalga qo‘shish
async function fetchPositions() {
	try {
		const response = await fetch('http://localhost:5000/api/positions')
		if (!response.ok) {
			throw new Error('Serverdan ma’lumot olishda xatolik yuz berdi')
		}
		const positions = await response.json()
		allPositions = positions // Barcha lavozimlarni saqlaymiz
		renderPositions(positions) // Jadvalni yangilaymiz
		updateTotalPositions(positions.length) // Umumiy sonni yangilaymiz
		populateParentPositionSelect(positions) // Yuqori turuvchi lavozimlar ro‘yxatini yangilaymiz
	} catch (error) {
		console.error('Lavozimlarni olishda xatolik:', error)
		alert(
			'Lavozimlarni yuklashda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.'
		)
	}
}

// Yuqori turuvchi lavozimlar uchun select elementini to‘ldirish
function populateParentPositionSelect(positions) {
	const parentSelect = document.getElementById('parent-position')
	if (parentSelect) {
		parentSelect.innerHTML = '<option value="">Hech qaysi</option>' // Default opsiya
		positions.forEach(position => {
			const option = document.createElement('option')
			option.value = position.id
			option.textContent = position.name_uz // O‘zbekcha nomini ko‘rsatamiz
			parentSelect.appendChild(option)
		})
	}
}

// Lavozimlarni jadvalga render qilish
function renderPositions(positions) {
	const tbody = document.getElementById('positions-tbody')
	tbody.innerHTML = '' // Jadvalni tozalash

	positions.forEach((position, index) => {
		const row = document.createElement('tr')
		// Yuqori turuvchi lavozim nomini topish
		const parentPosition = position.parent_position_id
			? positions.find(p => p.id === position.parent_position_id)?.name_uz ||
			  'Noma’lum'
			: 'Hech qaysi'

		row.innerHTML = `
            <td>${index + 1}</td>
            <td class="position-name">${position.name_uz}</td>
            <td>${position.name_ru}</td>
            <td>${position.name_en}</td>
            <td>${parentPosition}</td>
            <td><button class="btn-delete" data-id="${
							position.id
						}">O‘chirish</button></td>
        `

		// Tahrirlash uchun addEventListener qo‘shish
		const positionNameCell = row.querySelector('.position-name')
		positionNameCell.addEventListener('click', () => {
			openEditPositionModal(
				position.id,
				position.name_uz,
				position.name_ru,
				position.name_en,
				position.parent_position_id
			)
		})

		// O‘chirish tugmasi uchun addEventListener qo‘shish
		const deleteButton = row.querySelector('.btn-delete')
		deleteButton.addEventListener('click', () => {
			deletePosition(position.id)
		})

		tbody.appendChild(row)
	})
}

// Umumiy lavozimlar sonini yangilash
function updateTotalPositions(count) {
	const totalElement = document.getElementById('total-positions-count')
	if (totalElement) {
		totalElement.textContent = count
	}
}

// Strukturani daraxt shaklida qurish uchun rekursiv funksiya
function buildPositionTree(positionId, positions, level = 0) {
	const position = positions.find(p => p.id === positionId)
	if (!position) return ''

	// Lavozimni HTML sifatida qaytarish
	let html = `<div class="tree-node" style="margin-left: ${level * 20}px;">${
		position.name_uz
	}</div>`

	// Ushbu lavozimning pastki lavozimlarini topish
	const children = positions.filter(p => p.parent_position_id === positionId)
	if (children.length > 0) {
		html += '<div class="tree-children">'
		children.forEach(child => {
			html += buildPositionTree(child.id, positions, level + 1)
		})
		html += '</div>'
	}

	return html
}

// Barcha lavozimlar ierarxiyasini qurish
function buildFullPositionTree(positions) {
	// Yuqori turuvchi lavozimlarni topish (parent_position_id NULL bo‘lganlar)
	const topLevelPositions = positions.filter(p => !p.parent_position_id)
	let html = ''

	topLevelPositions.forEach(position => {
		html += buildPositionTree(position.id, positions)
	})

	return html
}

// Strukturani Excel formatida yuklab olish
function exportStructureToExcel() {
	const treeContainer = document.getElementById('structure-tree')
	const nodes = treeContainer.querySelectorAll('.tree-node')

	// Excel uchun ma'lumotlarni tayyorlash
	const data = []
	nodes.forEach((node, index) => {
		const level = parseInt(node.style.marginLeft || '0') / 20 // Lavozim darajasini hisoblash
		const name = node.childNodes[0].textContent.trim() // Lavozim nomi
		data.push({
			'Lavozim darajasi': level,
			'Lavozim nomi': name,
		})
	})

	// Excel faylini yaratish
	const ws = XLSX.utils.json_to_sheet(data)
	const wb = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(wb, ws, 'Struktura')

	// Faylni yuklab olish
	XLSX.writeFile(wb, 'Lavozimlar_Struktura.xlsx')
}

// Struktura modalini ochish
function openStructureModal() {
	const modal = document.getElementById('structure-modal')
	const treeContainer = document.getElementById('structure-tree')
	const title = document.getElementById('structure-modal-title')

	if (modal && treeContainer && title) {
		title.textContent = 'Lavozimlar struktura'
		// Barcha lavozimlar ierarxiyasini qurish
		let treeHtml = buildFullPositionTree(allPositions)

		treeContainer.innerHTML = treeHtml
		modal.style.display = 'flex'
		// Sahifaning asosiy skrollini o‘chirish
		document.body.style.overflow = 'hidden'

		// Esc tugmasi bosilganda modalni yopish uchun event listener qo‘shish
		const handleEscKey = event => {
			if (event.key === 'Escape') {
				closeStructureModal()
			}
		}
		document.addEventListener('keydown', handleEscKey)

		// Modaldan tashqari bosilganda modalni yopish uchun event listener qo‘shish
		const handleOutsideClick = event => {
			// Agar bosilgan joy .modal-content dan tashqarida bo‘lsa
			if (event.target === modal) {
				closeStructureModal()
			}
		}
		modal.addEventListener('click', handleOutsideClick)

		// Modal yopilganda event listenerlarni o‘chirish uchun funksiyani saqlash
		modal.closeListeners = { handleEscKey, handleOutsideClick }
	}
}

// Struktura modalini yopish
function closeStructureModal() {
	const modal = document.getElementById('structure-modal')
	if (modal) {
		modal.style.display = 'none'
		// Sahifaning asosiy skrollini qayta tiklash
		document.body.style.overflow = 'auto'

		// Event listenerlarni o‘chirish
		if (modal.closeListeners) {
			document.removeEventListener('keydown', modal.closeListeners.handleEscKey)
			modal.removeEventListener(
				'click',
				modal.closeListeners.handleOutsideClick
			)
			modal.closeListeners = null // O‘chirilgan listenerlarni tozalash
		}
	}
}

// Modalni ochish (yangi lavozim qo‘shish uchun)
function openAddPositionModal() {
	const modal = document.getElementById('position-modal')
	const form = document.getElementById('position-form')
	const title = document.getElementById('modal-title')

	if (modal && form && title) {
		title.textContent = 'Yangi lavozim qo‘shish'
		form.reset() // Formani tozalash
		form.dataset.mode = 'add'
		form.dataset.id = ''
		const parentSelect = document.getElementById('parent-position')
		if (parentSelect) {
			parentSelect.value = '' // Default sifatida "Hech qaysi" tanlanadi
		}
		modal.style.display = 'flex'
		// Body skrollini o‘chirish
		document.body.style.overflow = 'hidden'

		// Esc tugmasi bosilganda modalni yopish uchun event listener qo‘shish
		const handleEscKey = event => {
			if (event.key === 'Escape') {
				closePositionModal()
			}
		}
		document.addEventListener('keydown', handleEscKey)

		// Modaldan tashqari bosilganda modalni yopish uchun event listener qo‘shish
		const handleOutsideClick = event => {
			if (event.target === modal) {
				closePositionModal()
			}
		}
		modal.addEventListener('click', handleOutsideClick)

		// Modal yopilganda event listenerlarni o‘chirish uchun funksiyani saqlash
		modal.closeListeners = { handleEscKey, handleOutsideClick }
	}
}

// Modalni ochish (tahrirlash uchun)
function openEditPositionModal(
	id,
	name_uz,
	name_ru,
	name_en,
	parent_position_id
) {
	const modal = document.getElementById('position-modal')
	const form = document.getElementById('position-form')
	const title = document.getElementById('modal-title')

	if (modal && form && title) {
		title.textContent = 'Lavozimni tahrirlash'
		document.getElementById('position-name-uz').value = name_uz
		document.getElementById('position-name-ru').value = name_ru
		document.getElementById('position-name-en').value = name_en
		const parentSelect = document.getElementById('parent-position')
		if (parentSelect) {
			parentSelect.value = parent_position_id || '' // Yuqori turuvchi lavozimni tanlash
		}
		form.dataset.mode = 'edit'
		form.dataset.id = id
		modal.style.display = 'flex'
		// Body skrollini o‘chirish
		document.body.style.overflow = 'hidden'

		// Esc tugmasi bosilganda modalni yopish uchun event listener qo‘shish
		const handleEscKey = event => {
			if (event.key === 'Escape') {
				closePositionModal()
			}
		}
		document.addEventListener('keydown', handleEscKey)

		// Modaldan tashqari bosilganda modalni yopish uchun event listener qo‘shish
		const handleOutsideClick = event => {
			if (event.target === modal) {
				closePositionModal()
			}
		}
		modal.addEventListener('click', handleOutsideClick)

		// Modal yopilganda event listenerlarni o‘chirish uchun funksiyani saqlash
		modal.closeListeners = { handleEscKey, handleOutsideClick }
	}
}

// Modalni yopish
function closePositionModal() {
	const modal = document.getElementById('position-modal')
	if (modal) {
		modal.style.display = 'none'
		// Body skrollini qayta yoqish
		document.body.style.overflow = 'auto'

		// Event listenerlarni o‘chirish
		if (modal.closeListeners) {
			document.removeEventListener('keydown', modal.closeListeners.handleEscKey)
			modal.removeEventListener(
				'click',
				modal.closeListeners.handleOutsideClick
			)
			modal.closeListeners = null // O‘chirilgan listenerlarni tozalash
		}
	}
}

// Lavozim qo‘shish yoki tahrirlash
function handlePositionFormSubmit(e) {
	e.preventDefault()
	const form = e.target
	const mode = form.dataset.mode
	const id = form.dataset.id
	const name_uz = document.getElementById('position-name-uz').value.trim()
	const name_ru = document.getElementById('position-name-ru').value.trim()
	const name_en = document.getElementById('position-name-en').value.trim()
	const parent_position_id =
		document.getElementById('parent-position').value || null

	if (!name_uz || !name_ru || !name_en) {
		alert('Iltimos, barcha tillardagi lavozim nomlarini kiriting!')
		return
	}

	const positionData = { name_uz, name_ru, name_en, parent_position_id }

	const url =
		mode === 'add'
			? 'http://localhost:5000/api/positions'
			: `http://localhost:5000/api/positions/${id}`
	const method = mode === 'add' ? 'POST' : 'PUT'

	fetch(url, {
		method: method,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(positionData),
	})
		.then(response => response.json())
		.then(result => {
			if (result.message) {
				alert(result.message)
				closePositionModal()
				fetchPositions()
			} else {
				alert('Xatolik: ' + (result.error || 'Noma’lum xatolik'))
			}
		})
		.catch(error => {
			console.error('Lavozim qo‘shish/tahrirlashda xatolik:', error)
			alert('Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.')
		})
}

// Lavozimni o‘chirish
async function deletePosition(id) {
	if (!confirm('Bu lavozimni o‘chirishni tasdiqlaysizmi?')) return

	try {
		const response = await fetch(`http://localhost:5000/api/positions/${id}`, {
			method: 'DELETE',
		})
		const result = await response.json()
		if (response.ok) {
			alert(result.message)
			fetchPositions()
		} else {
			alert(result.message || 'Lavozimni o‘chirishda xatolik yuz berdi')
		}
	} catch (error) {
		console.error('Lavozimni o‘chirishda xatolik:', error)
		alert('Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.')
	}
}

// Qidiruv funksiyasi
function handleSearch(e) {
	const searchTerm = e.target.value.toLowerCase()
	const filteredPositions = allPositions.filter((position, index) => {
		const parentPositionName = position.parent_position_id
			? allPositions
					.find(p => p.id === position.parent_position_id)
					?.name_uz?.toLowerCase() || ''
			: ''
		return (
			(index + 1).toString().includes(searchTerm) ||
			position.name_uz.toLowerCase().includes(searchTerm) ||
			position.name_ru.toLowerCase().includes(searchTerm) ||
			position.name_en.toLowerCase().includes(searchTerm) ||
			parentPositionName.includes(searchTerm)
		)
	})
	renderPositions(filteredPositions)
	updateTotalPositions(filteredPositions.length)
}

// Hodisalarni ulash
function initializeEventListeners() {
	const positionForm = document.getElementById('position-form')
	if (positionForm) {
		positionForm.addEventListener('submit', handlePositionFormSubmit)
	}

	const searchInput = document.getElementById('search-input')
	if (searchInput) {
		searchInput.addEventListener('input', handleSearch)
	}

	const addButton = document.querySelector('.btn-add')
	if (addButton) {
		addButton.addEventListener('click', openAddPositionModal)
	}

	const structureButton = document.querySelector('.btn-structure')
	if (structureButton) {
		structureButton.addEventListener('click', openStructureModal)
	}

	const closeButton = document.querySelector('.btn-close')
	if (closeButton) {
		closeButton.addEventListener('click', closePositionModal)
	}
}

// Sahifa yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
	fetchPositions()
	initializeEventListeners()
})
