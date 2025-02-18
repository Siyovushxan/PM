document.addEventListener('DOMContentLoaded', function () {
	const projectsContainer = document.querySelector('.projects')
	const editModal = document.getElementById('editModal')
	const taskModal = document.getElementById('taskModal')
	const closeEditModal = document.querySelector('.close')
	const closeTaskModal = document.querySelector('.close-task')
	const editForm = document.getElementById('edit-form')
	const taskForm = document.getElementById('task-form')

	// LocalStorage'dan loyihalarni olish
	let projects = JSON.parse(localStorage.getItem('projects')) || []

	// Loyihalarni ekranga chiqarish funksiyasi
	function renderProjects() {
		projectsContainer.innerHTML = '' // Oldingi ma'lumotlarni tozalash

		projects.forEach((project, index) => {
			// Loyihaning tugash sanasi va boshlanish sanasini olish
			const startDate = new Date(project.startDate)
			const endDate = new Date(project.endDate)

			if (isNaN(startDate) || isNaN(endDate)) {
				console.error(
					`Noto'g'ri sana formati: ${project.startDate} yoki ${project.endDate}`
				)
				return
			}

			// Joriy sana
			const currentDate = new Date()

			// Loyihaning tugash sanasi va joriy sana o'rtasidagi farqni hisoblash
			const remainingTime = endDate - currentDate // Millisekund farq

			const remainingDays = Math.ceil(remainingTime / (1000 * 3600 * 24)) // Qolgan kunlar

			// Agar sanalar teng bo'lsa, "Bugun" deb ko'rsatish
			let remainingText = ''
			if (remainingDays === 0) {
				remainingText = 'Bugun'
			} else if (remainingDays > 0) {
				remainingText = `Qolgan ${remainingDays + 1} kun`
			} else {
				remainingText = `${Math.abs(
					remainingDays
				)} KUNGA KECHIKDI`
			}

			const projectCard = document.createElement('div')
			projectCard.classList.add('project-card')

			projectCard.innerHTML += `
      <h3 class="project-title">${project.name}</h3>
      <p class="project-description">${project.description}</p>
      <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${
				project.endDate
			}</p>
      <p class="project-remaining">Muddat: ${remainingText}</p>
      <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>
      <p class="project-status">Mas'ul hodim: <span class="status">${
				project.statusMasul
			}</span></p>
      <div class="bottons">
        <div class="left">
          <button class="edit-btn" data-index="${index}">Tahrirlash</button>
          <button class="delete-btn" data-index="${index}">O'chirish</button>
        </div>
        <div class="right">
          <button class="add-task-btn" data-index="${index}">Vazifa qo'shish</button>
        </div>
      </div>
    `

			projectsContainer.appendChild(projectCard)
		})

		// Har bir "Tahrirlash" tugmasiga bosilganda modalni ochish
		document.querySelectorAll('.edit-btn').forEach(button => {
			button.addEventListener('click', function () {
				const projectIndex = this.getAttribute('data-index')
				const project = projects[projectIndex]

				document.getElementById('edit-project-name').value = project.name
				document.getElementById('edit-project-description').value =
					project.description
				document.getElementById('edit-start-date').value = project.startDate
				document.getElementById('edit-end-date').value = project.endDate
				document.getElementById('edit-status').value = project.status
				document.getElementById('edit-statusMasul').value = project.statusMasul
				document.getElementById('edit-index').value = projectIndex

				editModal.style.display = 'block'
			})
		})

		// Har bir "O'chirish" tugmasiga bosilganda loyiha o'chiriladi
		document.querySelectorAll('.delete-btn').forEach(button => {
			button.addEventListener('click', function () {
				const projectIndex = this.getAttribute('data-index')
				const confirmation = confirm(
					'Siz ushbu loyihani o‘chirishga ishonchingiz komilmi?'
				)
				if (confirmation) {
					projects.splice(projectIndex, 1) // Loyihani massivdan o'chirish
					localStorage.setItem('projects', JSON.stringify(projects)) // Yangilangan massivni saqlash
					renderProjects() // Loyihalarni qayta ko'rsatish
				}
			})
		})

		// Har bir "Vazifa Qo'shish" tugmasiga bosilganda modalni ochish
		document.querySelectorAll('.add-task-btn').forEach(button => {
			button.addEventListener('click', function () {
				const projectIndex = this.getAttribute('data-index')
				document.getElementById('task-index').value = projectIndex
				taskModal.style.display = 'block'
			})
		})
	}

	// Loyihalarni birinchi marta yuklash
	renderProjects()

	// Tahrir modalini yopish
	closeEditModal.addEventListener('click', function () {
		editModal.style.display = 'none'
	})

	// Vazifa modalini yopish
	closeTaskModal.addEventListener('click', function () {
		taskModal.style.display = 'none'
	})

	window.addEventListener('click', function (event) {
		if (event.target == editModal) {
			editModal.style.display = 'none'
		}
		if (event.target == taskModal) {
			taskModal.style.display = 'none'
		}
	})

	// Tahrirlangan loyihani saqlash
	editForm.addEventListener('submit', function (event) {
		event.preventDefault()

		const projectIndex = document.getElementById('edit-index').value

		projects[projectIndex] = {
			...projects[projectIndex],
			name: document.getElementById('edit-project-name').value,
			description: document.getElementById('edit-project-description').value,
			startDate: document.getElementById('edit-start-date').value,
			endDate: document.getElementById('edit-end-date').value,
			status: document.getElementById('edit-status').value,
			statusMasul: document.getElementById('edit-statusMasul').value,
		}

		localStorage.setItem('projects', JSON.stringify(projects)) // Yangilangan loyihalarni saqlash
		editModal.style.display = 'none'

		renderProjects() // Yangilangan ma'lumotlarni chiqarish
	})

	// Yangi vazifa qo'shish
	taskForm.addEventListener('submit', function (event) {
		event.preventDefault()

		const projectIndex = document.getElementById('task-index').value

		const newTask = {
			name: document.getElementById('task-name').value,
			description: document.getElementById('task-description').value,
			taskStartDate: document.getElementById('task-start-date').value,
			taskEndDate: document.getElementById('task-end-date').value,
			vazifaMasulHodim: document.getElementById('vazifa-masul-hodim').value,
			vazifa: document.getElementById('vazifa').value,
		}

		if (!projects[projectIndex].tasks) {
			projects[projectIndex].tasks = []
		}

		projects[projectIndex].tasks.push(newTask)

		localStorage.setItem('projects', JSON.stringify(projects))
		taskModal.style.display = 'none'

		renderProjects()

		taskForm.reset()
	})
})
