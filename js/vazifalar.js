document.addEventListener('DOMContentLoaded', function () {
  const projectsContainer = document.querySelector('.vazifalar');

  if (!projectsContainer) {
    console.error('.projects elementi topilmadi!');
    return;
  }

  let projects = JSON.parse(localStorage.getItem('projects')) || [];
  const editTaskModal = document.getElementById('editTaskModal');
  const closeEditTaskModal = document.querySelector('.close-edit-task');
  const editTaskForm = document.getElementById('edit-task-form');

  let currentProjectIndex = null;
  let currentTaskIndex = null;

  // Vazifa tahrirlash oynasini yopish
  closeEditTaskModal.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
  });

  // Loyihalarni render qilish
  function renderProjects() {
    projectsContainer.innerHTML = '';
    projects.forEach((project, projectIndex) => {
      const projectCard = document.createElement('div');
      projectCard.classList.add('project-card');

      projectCard.innerHTML = `
        <h3 class="project-title">${projectIndex + 1}. ${project.name}</h3>
        <p class="project-description">${project.description}</p>
        <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${project.endDate}</p>
        <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>

        <div class="tasks">
          <h4>Vazifalar:</h4>
          <ul>
            ${project.tasks && project.tasks.length > 0
              ? project.tasks
                  .map(
                    (task, taskIndex) => `
                    <li>
											<div>
                      	${taskIndex + 1}. Vazifa nomi: ${task.name} Vazifa haqida izoh: ${task.description} | Boshlanish va Tugash sana: ${task.startDate} - ${task.endDate} | vazifaga mas'ul hodim: ${task.vazifaMasulHodim} | Status: ${task.vazifa}
											</div>
											<div class="vazifa-button">
												<button class="edit-task-btn" data-project-index="${projectIndex}" data-task-index="${taskIndex}">Tahrirlash</button>
												<button class="delete-task-btn" data-project-index="${projectIndex}" data-task-index="${taskIndex}">O'chirish</button>
												<button class="write-task-btn" data-project-index="${projectIndex}" data-task-index="${taskIndex}">Xabar yozish</button>
											</div>
                    </li>`
                  )
                  .join('')
              : '<li>Hozircha vazifa yo‘q</li>'}
          </ul>
        </div>
      `;
      projectsContainer.appendChild(projectCard);
    });

    // Tahrirlash tugmasini bosganda
    document.querySelectorAll('.edit-task-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        currentProjectIndex = this.dataset.projectIndex;
        currentTaskIndex = this.dataset.taskIndex;

        const task = projects[currentProjectIndex].tasks[currentTaskIndex];
        document.getElementById('edit-task-name').value = task.name;
        document.getElementById('edit-task-description').value = task.description;
        document.getElementById('edit-task-start-date').value = task.startDate;
        document.getElementById('edit-task-end-date').value = task.endDate;
        document.getElementById('edit-task-status').value = task.vazifa;
        document.getElementById('edit-task-responsible').value = task.vazifaMasulHodim;

        editTaskModal.style.display = 'block';
      });
    });

    // O'chirish tugmasini bosganda
    document.querySelectorAll('.delete-task-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const projectIndex = this.dataset.projectIndex;
        const taskIndex = this.dataset.taskIndex;

        if (confirm('Ushbu vazifani o‘chirishga ishonchingiz komilmi?')) {
          projects[projectIndex].tasks.splice(taskIndex, 1);
          localStorage.setItem('projects', JSON.stringify(projects));
          renderProjects();
        }
      });
    });
  }

  // Tahrirlangan vazifani saqlash
  editTaskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const updatedTask = {
      name: document.getElementById('edit-task-name').value,
      description: document.getElementById('edit-task-description').value,
      startDate: document.getElementById('edit-task-start-date').value,
      endDate: document.getElementById('edit-task-end-date').value,
      vazifa: document.getElementById('edit-task-status').value,
      vazifaMasulHodim: document.getElementById('edit-task-responsible').value,
    };

    projects[currentProjectIndex].tasks[currentTaskIndex] = updatedTask;
    localStorage.setItem('projects', JSON.stringify(projects));

    editTaskModal.style.display = 'none';
    renderProjects();
  });

  renderProjects();
});
