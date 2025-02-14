document.addEventListener('DOMContentLoaded', function () {
	const projectsContainer = document.querySelector('.vazifalar')

	if (!projectsContainer) {
		console.error('.projects elementi topilmadi!')
		return
	}

	let projects = JSON.parse(localStorage.getItem('projects')) || []

	if (projects.length === 0) {
		console.warn("LocalStorage bo'sh! Yangi loyiha qo'shing.")
		return
	}

	projects.forEach((project, index) => {
		const projectCard = document.createElement('div')
		projectCard.classList.add('project-card')

		projectCard.innerHTML = `
      <h3 class="project-title">${index + 1}. ${project.name}</h3>
      <p class="project-description">${project.description}</p>
      <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${
			project.endDate
		}</p>
      <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>

			  <div class="tasks">
          <h4>Vazifalar:</h4>
          <ul>
            ${
							project.tasks && project.tasks.length > 0
								? project.tasks
										.map(
											task =>
												`<li>${task.name} | ${task.startDate} - ${task.endDate} |</li>`
										)
										.join('')
								: '<li style="text-decoratsion: none">Hozircha vazifa yo‘q</li>'
						}
          </ul>
        </div>
    `

		projectsContainer.appendChild(projectCard)
	})
})
