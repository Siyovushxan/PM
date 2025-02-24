document.addEventListener("DOMContentLoaded", () => {
    const projectsContainer = document.querySelector(".projects");
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("edit-form");
    const closeModal = document.querySelector(".close");

    let currentProjectId = null;

    // Barcha loyihalarni olish va ko‘rsatish
    async function loadProjects() {
        try {
            const response = await fetch("http://localhost:5000/api/projects");
            if (!response.ok) {
                throw new Error(`Server javobi: ${response.status} - ${response.statusText}`);
            }

            const projects = await response.json();

            if (!projects || projects.length === 0) {
                projectsContainer.innerHTML = "<p>Hozircha hech qanday loyiha yo'q.</p>";
                return;
            }

            projectsContainer.innerHTML = ""; // Oldingi kontentni tozalash
            projects.forEach(project => {
                const projectCard = document.createElement("div");
                projectCard.classList.add("project-card");

                projectCard.innerHTML = `
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description}</p>
                    <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${project.endDate}</p>
                    <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>
                    <p class="project-status">Mas'ul hodim: <span class="status">${project.responsible}</span></p>
                    <div class="bottons">
                        <div class="left">
                            <button class="edit-btn" data-id="${project.id}">Tahrirlash</button>
                            <button class="delete-btn" data-id="${project.id}">O'chirish</button>
                        </div>
                    </div>
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
                            throw new Error(`Loyiha topilmadi: ${response.status}`);
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
                        alert("Loyihani yuklashda xatolik yuz berdi!");
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
                                throw new Error(`O‘chirishda xatolik: ${response.status}`);
                            }

                            const data = await response.json();
                            alert(data.message);
                            loadProjects(); // Loyihalar ro‘yxatini yangilash
                        } catch (error) {
                            console.error("O‘chirishda xatolik:", error);
                            alert("Loyihani o‘chirishda xatolik yuz berdi!");
                        }
                    }
                });
            });
        } catch (error) {
            console.error("Xatolik:", error.message);
            projectsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`;
        }
    }

    // Modal elementini tekshirish
    if (!editModal || !closeModal) {
        console.error("Modal yoki close tugmasi topilmadi. HTML da 'editModal' ID si yoki '.close' classi mavjudligini tekshiring.");
        return;
    }

    // Modalni yopish uchun close tugmasi
    closeModal.addEventListener("click", () => {
        editModal.style.display = "none";
        console.log("Modal close tugmasi orqali yopildi.");
    });

    // Modal tashqarisiga bosilganda yopish
    window.addEventListener("click", (event) => {
        console.log("Window bosildi, target:", event.target, "Modal:", editModal);
        if (event.target === editModal) {
            editModal.style.display = "none";
            console.log("Modal tashqarisiga bosilgan holda yopildi.");
        }
    });

    // Esc tugmasi bosilganda yopish
    document.addEventListener("keydown", (event) => {
        console.log("Tugma bosildi, key:", event.key);
        if (event.key === "Escape" && editModal.style.display === "block") {
            editModal.style.display = "none";
            console.log("Esc tugmasi orqali modal yopildi.");
        }
    });

    // Formani saqlash (yangilash)
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
                throw new Error(`Yangilashda xatolik: ${response.status}`);
            }

            const data = await response.json();
            alert(data.message);
            editModal.style.display = "none"; // Modalni yopish
            loadProjects(); // Loyihalar ro‘yxatini yangilash
        } catch (error) {
            console.error("Yangilashda xatolik:", error);
            alert("Loyihani yangilashda xatolik yuz berdi!");
        }
    });

    // Loyihalarni yuklashni boshlash
    loadProjects();
});