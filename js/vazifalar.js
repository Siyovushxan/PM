document.addEventListener('DOMContentLoaded', function () {
	const projectsContainer = document.querySelector('.vazifalar')

	if (!projectsContainer) {
		console.error('.projects elementi topilmadi!')
		return
	}

	let projects = JSON.parse(localStorage.getItem('projects')) || []
	const editTaskModal = document.getElementById('editTaskModal')
	const closeEditTaskModal = document.querySelector('.close-edit-task')
	const editTaskForm = document.getElementById('edit-task-form')

	let currentProjectIndex = null
	let currentTaskIndex = null

	// Vazifa tahrirlash oynasini yopish
	closeEditTaskModal.addEventListener('click', () => {
		editTaskModal.style.display = 'none'
	})

	// Loyihalarni render qilish
	function renderProjects() {
		projectsContainer.innerHTML = ''
		projects.forEach((project, projectIndex) => {
			const projectCard = document.createElement('div')
			projectCard.classList.add('project-card')

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
				remainingText = `${Math.abs(remainingDays)} KUNGA KECHIKDI`
			}

			projectCard.innerHTML = `
		  <h3 class="project-title">${projectIndex + 1}. ${project.name}</h3>
		  <p class="project-description">${project.description}</p>
		  <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${
				project.endDate
			}</p>
			<p class="project-remaining">Muddat: ${remainingText}</p> <!-- Qolgan kunlarni chiqarish -->
		  <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>
	  
		  <div class="tasks">
			<p class="vazifalar-ruyxati">Vazifalar ro'yxati</p>
			${
				project.tasks && project.tasks.length > 0
					? `
				  <table class="task-table">
					<thead>
					  <tr>
						<th>ID</th>
						<th>Vazifa nomi</th>
						<th>Izoh</th>
						<th>Muddat</th>
						<th>Mas'ul hodim</th>
						<th>Status</th>
						<th>Amallar</th>
					  </tr>
					</thead>
					<tbody>
					  ${project.tasks
							.map((task, taskIndex) => {
								const taskCurrentDate = new Date()
								const taskendDate = new Date(task.taskEndDate)
								const taskRemainingTime = taskendDate - taskCurrentDate

								const remainingTaskDays = Math.ceil(
									taskRemainingTime / (1000 * 3600 * 24)
								) // Qolgan kunlar
								console.log(remainingTaskDays)

								let remainingTaskText = ''
								let remainingClass = ''
								if (remainingTaskDays === 0) {
									remainingTaskText = 'Bugun'
									remainingClass = 'due-today' // Sariq rang
								} else if (remainingTaskDays > 0) {
									remainingTaskText = `${remainingTaskDays + 1} KUN QOLDI`
									remainingClass = 'on-time' // Yashil rang
								} else {
									remainingTaskText = `Muddat: ${Math.abs(
										remainingTaskDays
									)} KUNGA KECHIKDI`
									remainingClass = 'overdue' // Qizil rang
								}

								return `
							<tr>
							  <td>${taskIndex + 1}</td>
							  <td class="name-vazifa">${task.name}</td>
							  <td class="description">${task.description}</td>
							  <td class="startDate">${task.taskStartDate} - ${
									task.taskEndDate
								} <p class="${remainingClass}">${remainingTaskText}</p></td> <!-- Qolgan kunlarni ko'rsatish -->
							  <td class="vazifaMasulHodim">${task.vazifaMasulHodim}</td>
							  <td class="vazifa" style="font-weight: bold">${task.vazifa.toUpperCase()}</td>
							  <td class="task-actions">
								<button class="edit-task-btn" data-project-index="${projectIndex}" data-task-index="${taskIndex}">Tahrirlash</button>
								<button class="delete-task-btn" data-project-index="${projectIndex}" data-task-index="${taskIndex}">O'chirish</button>
								<button class="write-task-btn" data-project-index="${projectIndex}" data-task-index="${taskIndex}">Xabar yozish</button>
							  </td>
							</tr>`
							})
							.join('')}
					</tbody>
				  </table>`
					: '<p>Hozircha vazifa yo`q</p>'
			}
		  </div>
		`
			projectsContainer.appendChild(projectCard)
		})

		// Tahrirlash tugmasini bosganda
		document.querySelectorAll('.edit-task-btn').forEach(btn => {
			btn.addEventListener('click', function () {
				currentProjectIndex = this.dataset.projectIndex
				currentTaskIndex = this.dataset.taskIndex

				const task = projects[currentProjectIndex].tasks[currentTaskIndex]
				document.getElementById('edit-task-name').value = task.name
				document.getElementById('edit-task-description').value =
					task.description
				document.getElementById('edit-task-start-date').value =
					task.taskStartDate
				document.getElementById('edit-task-end-date').value = task.taskEndDate
				document.getElementById('edit-task-status').value = task.vazifa
				document.getElementById('edit-task-responsible').value =
					task.vazifaMasulHodim

				editTaskModal.style.display = 'block'
			})
		})

		// O'chirish tugmasini bosganda
		document.querySelectorAll('.delete-task-btn').forEach(btn => {
			btn.addEventListener('click', function () {
				const projectIndex = this.dataset.projectIndex
				const taskIndex = this.dataset.taskIndex

				if (confirm('Ushbu vazifani o‘chirishga ishonchingiz komilmi?')) {
					projects[projectIndex].tasks.splice(taskIndex, 1)
					localStorage.setItem('projects', JSON.stringify(projects))
					renderProjects()
				}
			})
		})
	}

	// Tahrirlangan vazifani saqlash
	editTaskForm.addEventListener('submit', function (e) {
		e.preventDefault()

		const updatedTask = {
			name: document.getElementById('edit-task-name').value,
			description: document.getElementById('edit-task-description').value,
			taskStartDate: document.getElementById('edit-task-start-date').value,
			taskEndDate: document.getElementById('edit-task-end-date').value,
			vazifa: document.getElementById('edit-task-status').value,
			vazifaMasulHodim: document.getElementById('edit-task-responsible').value,
		}

		projects[currentProjectIndex].tasks[currentTaskIndex] = updatedTask
		localStorage.setItem('projects', JSON.stringify(projects))

		editTaskModal.style.display = 'none'
		renderProjects()
	})

	renderProjects()
})
