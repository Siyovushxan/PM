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

    // Sanani parse qilish (2025 yil may -> YYYY-MM-DD)
    function parseDateFromDisplay(dateString) {
        if (!dateString || dateString === 'N/A') return null;
        const [year, , month] = dateString.split(' ');
        const monthNames = {
            'yanvar': '01', 'fevral': '02', 'mart': '03', 'aprel': '04', 'may': '05', 'iyun': '06',
            'iyul': '07', 'avgust': '08', 'sentyabr': '09', 'oktyabr': '10', 'noyabr': '11', 'dekabr': '12'
        };
        const monthNumber = monthNames[month.toLowerCase()];
        if (!monthNumber) return null;
        return `${year}-${monthNumber}-01`; // Kunni 01 deb olamiz
    }

    // Loyiha bo‘yicha vazifalarni olish
    async function getTasksByProject(projectId) {
        try {
            const response = await fetch(`http://localhost:5000/api/vazifalar?project_id=${projectId}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Vazifalar yuklanmadi: ${response.status} - ${errorText}`);
                return [];
            }
            const tasks = await response.json();
            return Array.isArray(tasks) ? tasks : [];
        } catch (error) {
            console.error(`Vazifalarni olishda xatolik (Loyiha ID: ${projectId}):`, error.message);
            return [];
        }
    }

    // Vazifa yangilash
    async function updateTask(taskId, taskData) {
        try {
            const response = await fetch(`http://localhost:5000/api/vazifalar/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData),
            });
            if (response.ok) {
                return { message: 'Vazifa muvaffaqiyatli yangilandi' };
            } else {
                const errorText = await response.text();
                throw new Error(`Vazifa yangilashda xatolik: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Vazifa yangilashda xatolik:', error);
            throw error;
        }
    }

    // Jadvalni Word hujjati sifatida yuklab olish
    function downloadAsWord(projectName, tasks) {
        // HTML hujjatini yaratish
        const htmlContent = `
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        table { width: 100%; border-collapse: collapse; font-family: Times New Roman; }
                        th, td { border: 1px solid black; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        h1, h2 { text-align: center; font-family: Times New Roman; }
                    </style>
                </head>
                <body>
                    <h1>"Navoiyuran" davlat korxonasi 2025-yil uchun mo‘ljallangan RAQAMLASHTIRISH DASTURI</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Chora-tadbirlar nomi</th>
                                <th>Amalga oshiriladigan mexanizm</th>
                                <th>Ijro muddati</th>
                                <th>Ijro uchun mas’ul</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tasks.map((task, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${task.vazifa_nomi || 'N/A'}</td>
                                    <td>${task.izoh || 'N/A'}</td>
                                    <td>${formatDateForDisplay(task.vazifa_tugash_sanasi)}</td>
                                    <td>${task.vazifa_masul_hodimi || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;

        // Blob yaratish
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}_roadmap.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            console.log('Olingan loyihalar:', projects);

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

                    // Jadvalni yaratish (Amallar ustuni olib tashlandi, contenteditable qo‘shildi)
                    let tableHTML = `
                        <div class="table-container">
                            <button class="download-word-btn" data-project-id="${projectId}" data-project-name="${project.name || 'N/A'}">Word sifatida yuklab olish</button>
                            <table border="1" class="task-table">
                                <thead>
                                    <tr>
                                        <th>№</th>
                                        <th>Chora-tadbirlar nomi</th>
                                        <th>Amalga oshiriladigan mexanizm</th>
                                        <th>Ijro muddati</th>
                                        <th>Ijro uchun mas’ul</th>
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
                            </tr>
                        `;
                    });

                    tableHTML += `
                                </tbody>
                            </table>
                        </div>
                    `;

                    roadmapTable.innerHTML = tableHTML;
                    roadmapTable.style.display = 'block';

                    // Tahrirlash hodisasi (onlayn tahrirlash)
                    document.querySelectorAll('.editable').forEach(cell => {
                        cell.addEventListener('blur', async () => {
                            const taskId = cell.closest('tr').dataset.taskId;
                            const field = cell.dataset.field;
                            const newValue = cell.textContent.trim();

                            // Agar qiymat o‘zgarmagan bo‘lsa, hech narsa qilmaymiz
                            const originalValue = field === 'vazifa_tugash_sanasi'
                                ? formatDateForDisplay(tasks.find(task => task.id == taskId)[field])
                                : tasks.find(task => task.id == taskId)[field];
                            if (newValue === originalValue) return;

                            // Yangi ma'lumotlarni tayyorlash
                            const updatedTask = {};
                            if (field === 'vazifa_tugash_sanasi') {
                                updatedTask[field] = parseDateFromDisplay(newValue);
                            } else {
                                updatedTask[field] = newValue;
                            }

                            try {
                                const result = await updateTask(taskId, updatedTask);
                                if (result.message === 'Vazifa muvaffaqiyatli yangilandi') {
                                    // Agar sana o‘zgartirilgan bo‘lsa, formatni qayta ko‘rsatish
                                    if (field === 'vazifa_tugash_sanasi') {
                                        cell.textContent = formatDateForDisplay(updatedTask[field]);
                                    }
                                    // Ma'lumotni yangilash
                                    tasks.find(task => task.id == taskId)[field] = updatedTask[field];
                                } else {
                                    alert('Vazifa yangilashda muammolar yuz berdi!');
                                    cell.textContent = originalValue; // Xato bo‘lsa, eski qiymatni qaytarish
                                }
                            } catch (error) {
                                console.error('Vazifa yangilashda xatolik:', error);
                                alert('Vazifa yangilashda xatolik yuz berdi: ' + error.message);
                                cell.textContent = originalValue; // Xato bo‘lsa, eski qiymatni qaytarish
                            }
                        });
                    });

                    // Word sifatida yuklab olish tugmasi uchun hodisa
                    document.querySelectorAll('.download-word-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const projectId = btn.dataset.projectId;
                            const projectName = btn.dataset.projectName;
                            const currentTasks = Array.from(document.querySelectorAll(`#roadmap-${projectId} .task-table tbody tr`)).map(row => {
                                return {
                                    vazifa_nomi: row.cells[1].textContent,
                                    izoh: row.cells[2].textContent,
                                    vazifa_tugash_sanasi: parseDateFromDisplay(row.cells[3].textContent),
                                    vazifa_masul_hodimi: row.cells[4].textContent,
                                };
                            });
                            downloadAsWord(projectName, currentTasks);
                        });
                    });
                });
            });
        } catch (error) {
            console.error('Xatolik:', error.message);
            roadmapsContainer.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`;
        }
    }

    // Loyihalarni yuklashni boshlash
    loadRoadmaps();
});