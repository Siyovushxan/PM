document.addEventListener('DOMContentLoaded', () => {
    // Loyihalar grafigi
    function renderProjectsChart() {
        const ctx = document.getElementById('projectsChart').getContext('2d');
        const labels = [
            'Umumiy loyihalar soni',
            'Aktiv loyihalar soni',
            'Bajarilayotgan loyihalar soni',
            'Rejalashtirilgan loyihalar soni',
            'To‘xtatilgan loyihalar soni',
            'Yakunlangan loyihalar soni'
        ];
        const data = [33, 10, 5, 3, 2, 13]; // Test ma'lumotlari
        const colors = ['#123524', '#3498db', '#f39c12', '#e74c3c', '#ff6f61', '#2ecc71'];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    // 3D effekt uchun soya
                    shadowOffsetX: 5,
                    shadowOffsetY: 5,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                }]
            },
            options: {
                responsive: true,
                cutout: '70%', // Donatning ichki qismini katta qilish
                rotation: -90, // Grafikni biroz aylantirish
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });

        // Label'larga qiymatlarni qo'shish
        const labelsDiv = document.querySelectorAll('.projects-section .chart-labels .label');
        labelsDiv.forEach((label, index) => {
            label.textContent = `${labels[index]}: ${data[index]}`;
        });
    }

    // Vazifalar grafigi
    function renderTasksChart() {
        const ctx = document.getElementById('tasksChart').getContext('2d');
        const labels = [
            'Umumiy vazifalar soni',
            'Aktiv vazifalar soni',
            'Bajarilayotgan vazifalar soni',
            'Rejalashtirilgan vazifalar soni',
            'To‘xtatilgan vazifalar soni',
            'Yakunlangan vazifalar soni'
        ];
        const data = [45, 15, 8, 5, 3, 14]; // Test ma'lumotlari
        const colors = ['#123524', '#3498db', '#f39c12', '#e74c3c', '#ff6f61', '#2ecc71'];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    // 3D effekt uchun soya
                    shadowOffsetX: 5,
                    shadowOffsetY: 5,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                rotation: -90,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });

        // Label'larga qiymatlarni qo'shish
        const labelsDiv = document.querySelectorAll('.tasks-section .chart-labels .label');
        labelsDiv.forEach((label, index) => {
            label.textContent = `${labels[index]}: ${data[index]}`;
        });
    }

    // Grafiklarni ishga tushirish
    renderProjectsChart();
    renderTasksChart();
});