document.addEventListener("DOMContentLoaded", () => {
    const taskList = document.getElementById("task-list");

    // URL dan project_id ni olish
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');

    // Sana formatini o‘zgartirish funksiyasi (YYYY-MM-DD -> DD.MM.YYYY)
    function formatDate(dateString) {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Loyihaga tegishli vazifalarni olish va ko‘rsatish
    async function loadTasks() {
        if (!projectId) {
            taskList.innerHTML = "<p>Loyiha ID topilmadi.</p>";
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/vazifalar?project_id=${projectId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Vazifalar yuklanmadi: ${response.status} - ${errorText}`);
            }
            const tasks = await response.json();
            taskList.innerHTML = tasks.length > 0
                ? `
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
                            ${tasks.map(task => `
                                <tr>
                                    <td>${task.vazifa_nomi || 'N/A'}</td>
                                    <td>${task.izoh || 'N/A'}</td>
                                    <td>${formatDate(task.vazifa_boshlanish_sanasi) || 'N/A'}</td>
                                    <td>${formatDate(task.vazifa_tugash_sanasi) || 'N/A'}</td>
                                    <td>${task.vazifa_status || 'N/A'}</td>
                                    <td>${task.vazifa_masul_hodimi || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `
                : "<p>Bu loyiha uchun vazifa yo'q.</p>";
        } catch (error) {
            console.error("Vazifalarni yuklashda xatolik:", error);
            taskList.innerHTML = `<p>Xatolik yuz berdi: ${error.message}</p>`;
        }
    }

    // Vazifalarni yuklashni boshlash
    loadTasks();
});