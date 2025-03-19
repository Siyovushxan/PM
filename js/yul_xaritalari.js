document.addEventListener('DOMContentLoaded', () => {
    const roadmapsContainer = document.querySelector('.roadmaps');

    // Sana formatini o‘zgartirish (YYYY-MM-DD -> 2025 yil may)
    function formatDateForDisplay(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        const year = date.getFullYear();
        const monthNames = [
            'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
            'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
        ];
        const month = monthNames[date.getMonth()];
        return `${year} yil ${month}`;
    }

    // Loyiha bo‘yicha vazifalarni olish
    async function getTasksByProject(projectId) {
        try {
            const response = await fetch(`http://localhost:5000/api/vazifalar/${projectId}`);
            if (!response.ok) {
                // Agar 404 qaytsa, bo‘sh array qaytaramiz
                if (response.status === 404) {
                    return [];
                }
                const errorText = await response.text();
                throw new Error(`Vazifalarni olishda xatolik: ${response.status} - ${errorText}`);
            }
            const tasks = await response.json();
            return Array.isArray(tasks) ? tasks : [];
        } catch (error) {
            console.error(`Vazifalarni olishda xatolik (Loyiha ID: ${projectId}):`, error.message);
            return [];
        }
    }

    // Barcha loyihalarni olish va ko‘rsatish
    async function loadRoadmaps() {
        try {
            const response = await fetch('http://localhost:5000/api/projects');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server javobi: ${response.status} - ${response.statusText} - ${errorText}`);
            }

            const projects = await response.json();

            if (!projects || projects.length === 0) {
                roadmapsContainer.innerHTML = "<p>Hozircha hech qanday loyiha yo'q.</p>";
                return;
            }

            roadmapsContainer.innerHTML = '';
            for (const project of projects) {
                const projectCard = document.createElement('div');
                projectCard.classList.add('project-card');

                projectCard.innerHTML = `
                    <h3 class="project-title">${project.name || 'N/A'}</h3>
                    <p class="project-description">${project.description || 'N/A'}</p>
                    <button class="roadmap-btn" data-id="${project.id || 0}">Yo‘l xaritasi</button>
                    <div class="roadmap-table" id="roadmap-${project.id}" style="display: none;"></div>
                `;
                roadmapsContainer.appendChild(projectCard);
            }

            // "Yo‘l xaritasi" tugmalari uchun hodisalar
            document.querySelectorAll('.roadmap-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const projectId = button.dataset.id;
                    const roadmapTable = document.getElementById(`roadmap-${projectId}`);

                    // Agar jadval allaqachon ko‘rsatilgan bo‘lsa, yashirish
                    if (roadmapTable.style.display === 'block') {
                        roadmapTable.style.display = 'none';
                        return;
                    }

                    // Vazifalarni olish
                    const tasks = await getTasksByProject(projectId);
                    if (tasks.length === 0) {
                        roadmapTable.innerHTML = '<p>Ushbu loyiha uchun vazifalar topilmadi.</p>';
                        roadmapTable.style.display = 'block';
                        return;
                    }

                    // Jadvalni yaratish
                    let tableHTML = `
                        <table border="1">
                            <thead>
                                <tr>
                                    <th>№</th>
                                    <th>Chora-tadbirlar nomi</th>
                                    <th>Amalga oshiriladigan mexanizm</th>
                                    <th>Ijro muddati</th>
                                    <th>Ijro uchun mas’ul</th>
                                    <th>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    tasks.forEach((task, index) => {
                        tableHTML += `
                            <tr data-task-id="${task.id}">
                                <td>${index + 1}</td>
                                <td contenteditable="true" class="editable" data-field="vazifa_nomi">${task.vazifa_nomi || 'N/A'}</td>
                                <td contenteditable="true" class="editable" data-field="izoh">${task.izoh || 'N/A'}</td>
                                <td contenteditable="true" class="editable" data-field="vazifa_tugash_sanasi">${formatDateForDisplay(task.vazifa_tugash_sanasi)}</td>
                                <td contenteditable="true" class="editable" data-field="vazifa_masul_hodimi">${task.vazifa_masul_hodimi || 'N/A'}</td>
                                <td>
                                    <button class="save-btn" data-task-id="${task.id}">Saqlash</button>
                                </td>
                            </tr>
                        `;
                    });

                    tableHTML += `
                            </tbody>
                        </table>
                    `;

                    roadmapTable.innerHTML = tableHTML;
                    roadmapTable.style.display = 'block';

                    // Saqlash tugmalari uchun hodisalar
                    document.querySelectorAll('.save-btn').forEach(saveButton => {
                        saveButton.addEventListener('click', async () => {
                            const taskId = saveButton.dataset.taskId;
                            const row = saveButton.closest('tr');
                            const updatedTask = {
                                vazifa_nomi: row.querySelector('[data-field="vazifa_nomi"]').textContent,
                                izoh: row.querySelector('[data-field="izoh"]').textContent,
                                vazifa_tugash_sanasi: parseDateFromDisplay(row.querySelector('[data-field="vazifa_tugash_sanasi"]').textContent),
                                vazifa_masul_hodimi: row.querySelector('[data-field="vazifa_masul_hodimi"]').textContent,
                            };

                            try {
                                const response = await fetch(`http://localhost:5000/api/vazifalar/${taskId}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(updatedTask),
                                });

                                if (!response.ok) {
                                    const errorText = await response.text();
                                    throw new Error(`Vazifani yangilashda xatolik: ${response.status} - ${errorText}`);
                                }

                                const data = await response.json();
                                alert(data.message);
                            } catch (error) {
                                console.error('Vazifani yangilashda xatolik:', error.message);
                                alert('Vazifani yangilashda xatolik yuz berdi: ' + error.message);
                            }
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Xatolik:', error.message);
            roadmapsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`;
        }
    }

    // "2025 yil may" formatidan "YYYY-MM-DD" formatiga o‘tkazish
    function parseDateFromDisplay(dateString) {
        if (!dateString || dateString === 'N/A') return null;
        const [year, , month] = dateString.split(' ');
        const monthNames = {
            'yanvar': '01', 'fevral': '02', 'mart': '03', 'aprel': '04', 'may': '05', 'iyun': '06',
            'iyul': '07', 'avgust': '08', 'sentyabr': '09', 'oktyabr': '10', 'noyabr': '11', 'dekabr': '12'
        };
        const monthNumber = monthNames[month.toLowerCase()];
        if (!monthNumber) return null;
        return `${year}-${monthNumber}-01`; // Kunni 01 deb olamiz, chunki faqat yil va oy berilgan
    }

    // Loyihalarni yuklashni boshlash
    loadRoadmaps();
});


// Loyiha bo‘yicha vazifalarni olish
async function getTasksByProject(projectId) {
    try {
        // projectId ni butun songa aylantiramiz va to‘g‘ri yuborilganligini tekshiramiz
        const id = parseInt(projectId);
        if (isNaN(id)) {
            console.error(`Noto‘g‘ri projectId: ${projectId}`);
            return [];
        }

        const response = await fetch(`http://localhost:5000/api/vazifalar/${id}`);
        if (!response.ok) {
            // Agar 404 qaytsa, bo‘sh array qaytaramiz
            if (response.status === 404) {
                return [];
            }
            const errorText = await response.text();
            throw new Error(`Vazifalarni olishda xatolik: ${response.status} - ${errorText}`);
        }
        const tasks = await response.json();
        return Array.isArray(tasks) ? tasks : [];
    } catch (error) {
        console.error(`Vazifalarni olishda xatolik (Loyiha ID: ${projectId}):`, error.message);
        return [];
    }
}