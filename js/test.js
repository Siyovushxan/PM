document.addEventListener("DOMContentLoaded", () => {
    const projectsContainer = document.querySelector(".projects");
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("edit-form");
    const closeModal = document.querySelector(".close");
    const editTaskModal = document.getElementById("editTaskModal"); // Vazifa qo‘shish modal
    const editTaskForm = document.getElementById("edit-task-form");
    const closeEditTask = document.querySelector(".close-edit-task");

    let currentProjectId = null;

    // Kunlar farqini hisoblash funksiyalari
    function getDaysDifference(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const differenceMs = end - start;
        const differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
        return differenceDays > 0 ? differenceDays : 0;
    }

    function getDaysPassed(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        const differenceMs = now - start;
        const differenceDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        return differenceDays >= 0 ? differenceDays : 0;
    }

    // Barcha loyihalarni olish va ko‘rsatish
    async function loadProjects() {
        try {
            const response = await fetch("http://localhost:5000/api/projects");
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server javobi: ${response.status} - ${response.statusText} - ${errorText}`);
            }

            const projects = await response.json();
            const tasksResponse = await fetch("http://localhost:5000/api/vazifalar");
            if (!tasksResponse.ok) {
                throw new Error(`Server javobi: ${tasksResponse.status} - ${tasksResponse.statusText}`);
            }
            const tasks = await tasksResponse.json();

            if (!projects || projects.length === 0) {
                projectsContainer.innerHTML = "<p>Hozircha hech qanday loyiha yo'q.</p>";
                return;
            }

            projectsContainer.innerHTML = ""; // Oldingi kontentni tozalash
            projects.forEach(project => {
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
                                    <th>#</th>
                                    <th>Vazifa nomi</th>
                                    <th>Izoh</th>
                                    <th>Boshlanish sanasi</th>
                                    <th>Tugash sanasi</th>
                                    <th>Kunlar farqi</th>
                                    <th>O‘tgan kunlar</th>
                                    <th>Status</th>
                                    <th>Mas'ul hodim</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${projectTasks.map((task, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${task.vazifa_nomi || '-'}</td>
                                        <td>${task.izoh || '-'}</td>
                                        <td>${task.vazifa_boshlanish_sanasi || '-'}</td>
                                        <td>${task.vazifa_tugash_sanasi || '-'}</td>
                                        <td>${getDaysDifference(task.vazifa_boshlanish_sanasi, task.vazifa_tugash_sanasi) || '-'}</td>
                                        <td>${getDaysPassed(task.vazifa_boshlanish_sanasi) || '-'}</td>
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

                // Loyiha uchun kunlar farqi va o‘tgan kunlar
                const totalDays = getDaysDifference(project.startDate, project.endDate);
                const passedDays = getDaysPassed(project.startDate);

                projectCard.innerHTML = `
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description}</p>
                    <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${project.endDate} | Umumiy kunlar: ${totalDays} | O‘tgan kunlar: ${passedDays}</p>
                    <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>
                    <p class="project-status">Mas'ul hodim: <span class="status">${project.responsible}</span></p>
                    <div class="bottons">
                        <div class="left">
                            <button class="edit-btn" data-id="${project.id}">Tahrirlash</button>
                            <button class="delete-btn" data-id="${project.id}">O'chirish</button>
                        </div>
                        <div>
                            <button class="edd-task-btn" data-id="${project.id}">Vazifa qo'shish</button>
                        </div>
                    </div>
                    ${tasksHtml}
                `;
                projectsContainer.appendChild(projectCard);
            });

            // Tahrirlash tugmalari uchun hodisalar
            document.querySelectorAll(".edit-btn").forEach(button => {
                button.addEventListener("click", async (event) => {
                    currentProjectId = event.target.dataset.id;
                    try {
                        const response = await fetch(`http://localhost:5000/api/projects/${currentProjectId}`);
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Loyiha topilmadi: ${response.status} - ${errorText}`);
                        }
                        const project = await response.json();

                        document.getElementById("edit-project-name").value = project.name;
                        document.getElementById("edit-project-description").value = project.description;
                        document.getElementById("edit-start-date").value = project.startDate;
                        document.getElementById("edit-end-date").value = project.endDate;
                        document.getElementById("edit-status").value = project.status;
                        document.getElementById("edit-statusMasul").value = project.responsible;

                        editModal.style.display = "block";
                    } catch (error) {
                        console.error("Tahrirlashda xatolik:", error);
                        alert("Loyihani yuklashda xatolik yuz berdi: " + error.message);
                    }
                });
            });

            // O‘chirish tugmalari uchun hodisalar
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", async (event) => {
                    const projectId = event.target.dataset.id;
                    if (confirm("Loyihani o‘chirishni istaysizmi?")) {
                        try {
                            const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                                method: "DELETE"
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`O‘chirishda xatolik: ${response.status} - ${errorText}`);
                            }

                            const data = await response.json();
                            alert(data.message);
                            loadProjects(); // Loyihalar ro‘yxatini yangilash
                        } catch (error) {
                            console.error("O‘chirishda xatolik:", error.message);
                            alert("Loyihani o‘chirishda xatolik yuz berdi: " + error.message);
                        }
                    }
                });
            });

        } catch (error) {
            console.error("Xatolik:", error.message);
            projectsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`;
        }
    }

    // Modal elementlarini tekshirish
    if (!editModal || !closeModal || !editTaskModal || !closeEditTask) {
        console.error("Modal yoki close tugmasi topilmadi. HTML da 'editModal' yoki 'editTaskModal' ID lari mavjudligini tekshiring.");
        return;
    }

    // Loyiha tahrirlash modalini yopish
    closeModal.addEventListener("click", () => {
        editModal.style.display = "none";
        console.log("Tahrirlash modal close tugmasi orqali yopildi.");
    });

    // Vazifa qo‘shish modalini yopish
    closeEditTask.addEventListener("click", () => {
        editTaskModal.style.display = "none";
    });

    // Ikkala modalni tashqarisiga bosilganda yopish
    window.addEventListener("click", (event) => {
        console.log("Window bosildi, target:", event.target, "Modal:", editModal);
        if (event.target === editModal) {
            editModal.style.display = "none";
            console.log("Tahrirlash modal tashqarisiga bosilgan holda yopildi.");
        }
        if (event.target === editTaskModal) {
            editTaskModal.style.display = "none";
            console.log("Vazifa qo‘shish modal tashqarisiga bosilgan holda yopildi.");
        }
    });

    // Esc tugmasi bosilganda yopish
    document.addEventListener("keydown", (event) => {
        console.log("Tugma bosildi, key:", event.key);
        if (event.key === "Escape" && (editModal.style.display === "block" || editTaskModal.style.display === "block")) {
            editModal.style.display = "none";
            editTaskModal.style.display = "none";
            console.log("Esc tugmasi orqali modal yopildi.");
        }
    });

    // Loyiha tahrirlash formasi
    editForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const updatedProject = {
            name: document.getElementById("edit-project-name").value,
            description: document.getElementById("edit-project-description").value,
            startDate: document.getElementById("edit-start-date").value,
            endDate: document.getElementById("edit-end-date").value,
            status: document.getElementById("edit-status").value,
            responsible: document.getElementById("edit-statusMasul").value
        };

        try {
            const response = await fetch(`http://localhost:5000/api/projects/${currentProjectId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProject)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Yangilashda xatolik: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            alert(data.message);
            editModal.style.display = "none"; // Modalni yopish
            loadProjects(); // Loyihalar ro‘yxatini yangilash
        } catch (error) {
            console.error("Yangilashda xatolik:", error.message);
            alert("Loyihani yangilashda xatolik yuz berdi: " + error.message);
        }
    });

    // Vazifa qo‘shish tugmasi uchun hodisa tinglovchi
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

    // Vazifa qo‘shish formasi
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
                throw new Error(`Vazifa qo'shishda xatolik: ${response.status} - ${errorText}`);
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