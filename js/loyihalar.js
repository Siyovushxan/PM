document.addEventListener("DOMContentLoaded", async () => {
    const projectsContainer = document.querySelector(".projects");
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("edit-form");
    const closeModal = document.querySelector(".close");

    let currentProjectId = null; // Hozir tahrirlanayotgan loyiha ID-si

    try {
        const response = await fetch("http://localhost:5000/api/projects");
        const projects = await response.json();

        if (projects.length === 0) {
            projectsContainer.innerHTML = "<p>Hozircha hech qanday loyiha yo'q.</p>";
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement("div");
            projectCard.classList.add("project-card");

            projectCard.innerHTML = `
                <h3 class="project-title">${project.name}</h3>
                <p class="project-description">${project.description}</p>
                <p class="project-dates">Boshlanish: ${project.startDate} | Tugash: ${project.endDate}</p>
                <p class="project-status">Status: <span class="status">${project.status.toUpperCase()}</span></p>
                <p class="project-status">Mas'ul hodim: <span class="status">${project.statusMasul}</span></p>
                <div class="bottons">
                    <div class="left">
                        <button class="edit-btn" data-id="${project.id}">Tahrirlash</button>
                        <button class="delete-btn" data-id="${project.id}">O'chirish</button>
                    </div>
                    <div class="right">
                        <button class="add-task-btn" data-id="${project.id}">Vazifa qo'shish</button>
                    </div>
                </div>
            `;

            projectsContainer.appendChild(projectCard);

        });

        // Tahrirlash tugmalarini tanlash va modalni ochish
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
                currentProjectId = event.target.dataset.id; // Loyihani ID sini olish
                const response = await fetch(`http://localhost:5000/api/projects/${currentProjectId}`); // ✅ To‘g‘ri!

                const project = await response.json();

                // Modal oynani ma’lumotlar bilan to‘ldirish
                document.getElementById("edit-project-name").value = project.name;
                document.getElementById("edit-project-description").value = project.description;
                document.getElementById("edit-start-date").value = project.startDate;
                document.getElementById("edit-end-date").value = project.endDate;
                document.getElementById("edit-status").value = project.status;
                document.getElementById("edit-statusMasul").value = project.responsible;

                editModal.style.display = "block"; // Modalni ochish
            });
        });

        // Modal oynani yopish
        closeModal.addEventListener("click", () => {
            editModal.style.display = "none";
        });

        // Modalni saqlash tugmasi bosilganda loyihani yangilash
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

            const response = await fetch(`http://localhost:5000/api/projects/${currentProjectId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProject)
            });

            if (response.ok) {
                alert("Loyiha yangilandi!");
                location.reload(); // Sahifani yangilash
            } else {
                alert("Xatolik yuz berdi!");
            }
        });

    } catch (error) {
        console.error("Xatolik:", error);
        projectsContainer.innerHTML = "<p>Serverga ulanishda xatolik yuz berdi.</p>";
    }
});
