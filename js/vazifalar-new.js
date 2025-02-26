document.addEventListener("DOMContentLoaded", () => {
    const projectsContainer = document.querySelector(".projects");
    const editTaskModal = document.getElementById("editTaskModal");
    const editTaskForm = document.getElementById("edit-task-form");
    const closeEditTask = document.querySelector(".close-edit-task");

    let currentProjectId = null;

    // Barcha vazifalarni olish
    async function loadTasks() {
        try {
            const response = await fetch("http://localhost:5000/api/vazifalar");
            if (!response.ok) {
                throw new Error(`Server javobi: ${response.status} - ${response.statusText}`);
            }
            const tasks = await response.json();
            return tasks || []; // Agar bo'sh bo'lsa, bo'sh massiv qaytarilsin
        } catch (error) {
            console.error("Vazifalarni yuklashda xatolik:", error.message);
            return [];
        }
    }

    // Barcha loyihalarni olish va ko‘rsatish
    async function loadProjects() {
        try {
            const response = await fetch("http://localhost:5000/api/projects");
            if (!response.ok) {
                throw new Error(`Server javobi: ${response.status} - ${response.statusText}`);
            }

            const projects = await response.json();
            const tasks = await loadTasks();

            if (!projects || projects.length === 0) {
                projectsContainer.innerHTML = "<p>Hozircha hech qanday loyiha yo'q.</p>";
                return;
            }

            projectsContainer.innerHTML = "";
            for (const project of projects) {
                const projectCard = document.createElement("div");
                projectCard.classList.add("project-card");

                // Loyihaga tegishli vazifalarni filtrlash
                const projectTasks = tasks.filter(task => task.project_id === project.id);
                let tasksHtml = '';
                if (projectTasks.length > 0) {
                    tasksHtml = `
                        <table class="task-table">
                            <thead>
                                <tr>
                                    <th>Vazifa nomi</th>
                                    <th>Izoh</th>
                                    <th>Boshlanish sanasi</th>
                                    <th>Tugash sanasi</th>
                                    <th>Status</th>
                                    <th>Mas'ul hodim</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${projectTasks.map(task => `
                                    <tr>
                                        <td>${task.vazifa_nomi || '-'}</td>
                                        <td>${task.izoh || '-'}</td>
                                        <td>${task.vazifa_boshlanish_sanasi || '-'}</td>
                                        <td>${task.vazifa_tugash_sanasi || '-'}</td>
                                        <td>${task.vazifa_status || '-'}</td>
                                        <td>${task.vazifa_masul_hodimi || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `;
                } else {
                    tasksHtml = '<p>Bu loyiha uchun hech qanday vazifa yo\'q.</p>';
                }

                projectCard.innerHTML = `
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description}</p>
                    <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${project.endDate}</p>
                    <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>
                    <div class="task-buttons">
                        <div class="task-masul">
                            <p class="project-status">Mas'ul hodim: <span class="status">${project.responsible}</span></p>
                        </div>
                        <div>
                            <button class="edd-task-btn" data-id="${project.id}">Vazifa qo'shish</button>
                        </div>
                    </div>
                    ${tasksHtml}
                `;
                projectsContainer.appendChild(projectCard);
            }

            // Vazifa qo'shish tugmasi uchun hodisa tinglovchi
            document.querySelectorAll(".edd-task-btn").forEach(button => {
                button.addEventListener("click", () => {
                    currentProjectId = button.dataset.id;
                    editTaskModal.style.display = "block"; // Modalni ochish
                    // Modalni tozalash
                    document.getElementById("edit-task-name").value = "";
                    document.getElementById("edit-task-description").value = "";
                    document.getElementById("edit-task-start-date").value = "";
                    document.getElementById("edit-task-end-date").value = "";
                    document.getElementById("edit-task-status").value = "rejalashtirilmoqda";
                    document.getElementById("edit-task-responsible").value = "";
                });
            });

        } catch (error) {
            console.error("Loyihalarni yuklashda xatolik:", error.message);
            projectsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`;
        }
    }

    // Esc tugmasi bosilganda yopish
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && editTaskModal.style.display === "block") {
            editTaskModal.style.display = "none";
            console.log("Esc tugmasi orqali modal yopildi.");
        }
    });

    // Modalni yopish uchun close tugmasi
    closeEditTask.addEventListener("click", () => {
        editTaskModal.style.display = "none";
    });

    // Modal tashqarisiga bosilganda yopish
    window.addEventListener("click", (event) => {
        if (event.target === editTaskModal) {
            editTaskModal.style.display = "none";
            console.log("Modal tashqarisiga bosilgan holda yopildi.");
        }
    });

    // Formani saqlash (vazifa qo'shish logikasi)
    editTaskForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const taskData = {
            project_id: currentProjectId,
            vazifa_nomi: document.getElementById("edit-task-name").value,
            izoh: document.getElementById("edit-task-description").value,
            vazifa_boshlanish_sanasi: document.getElementById("edit-task-start-date").value,
            vazifa_tugash_sanasi: document.getElementById("edit-task-end-date").value,
            vazifa_status: document.getElementById("edit-task-status").value,
            vazifa_masul_hodimi: document.getElementById("edit-task-responsible").value
        };

        try {
            const response = await fetch("http://localhost:5000/api/vazifalar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server javobi: ${response.status} - ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            alert(data.message || "Vazifa muvaffaqiyatli qo‘shildi!");
            editTaskModal.style.display = "none"; // Modalni yopish
            loadProjects(); // Loyihalarni qayta yuklash
        } catch (error) {
            console.error("Vazifa qo'shishda xatolik:", error.message);
            alert("Vazifa qo'shishda xatolik yuz berdi: " + error.message);
        }
    });

    // Loyihalarni yuklashni boshlash
    loadProjects();
});