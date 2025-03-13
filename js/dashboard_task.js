// Chart.js plaginini ro‘yxatdan o‘tkazish
Chart.register(ChartDataLabels);

// Ma'lumotlarni serverdan olish funksiyasi
async function fetchVazifalarData() {
  try {
    const response = await fetch('http://localhost:5000/api/all-vazifalar');
    if (!response.ok) {
      throw new Error('Vazifalarni yuklashda xatolik: ' + response.statusText);
    }
    const vazifalar = await response.json();

    // Status bo‘yicha ma'lumotlarni guruhlash
    const stats = {
      rejalashtirilmoqda: 0,
      bajarilmoqda: 0,
      yakunlandi: 0,
      toxtatildi: 0
    };

    vazifalar.forEach(vazifa => {
      const status = vazifa.vazifa_status.toLowerCase();
      if (status === 'rejalashtirilmoqda') {
        stats.rejalashtirilmoqda += 1;
      } else if (status === 'bajarilmoqda') {
        stats.bajarilmoqda += 1;
      } else if (status === 'yakunlandi') {
        stats.yakunlandi += 1;
      } else if (status === 'to\'xtatildi') {
        stats.toxtatildi += 1;
      }
    });

    // Umumiy vazifalar sonini hisoblash
    const total = vazifalar.length;

    // Aylana grafik uchun ma'lumotlar
    const doughnutData = [
      stats.rejalashtirilmoqda,
      stats.bajarilmoqda,
      stats.yakunlandi,
      stats.toxtatildi
    ];

    return { total, doughnutData };
  } catch (error) {
    console.error('Vazifalarni olishda xatolik:', error);
    return {
      total: 0,
      doughnutData: [0, 0, 0, 0]
    };
  }
}

// Faqat 0 bo‘lmagan ma'lumotlarni filtrlash funksiyasi
function filterNonZeroData(data, labels, colors) {
  const filteredData = [];
  const filteredLabels = [];
  const filteredColors = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i] > 0) {
      filteredData.push(data[i]);
      filteredLabels.push(labels[i]);
      filteredColors.push(colors[i]);
    }
  }

  return { filteredData, filteredLabels, filteredColors };
}

// Aylana grafikni chizish
async function initDoughnutChart() {
  const { total, doughnutData } = await fetchVazifalarData();

  // Barcha label va ranglarni aniqlash
  const labels = ['Rejalashtirilmoqda', 'Bajarilmoqda', 'Yakunlangan', 'To‘xtatildi'];
  const colors = [
    '#f39c12', // Sariq
    '#3498db', // Ko‘k
    '#2ecc71', // Yashil
    '#7f8c8d'  // Kulrang
  ];

  // 0 qiymatli elementlarni filtrlash
  const { filteredData, filteredLabels, filteredColors } = filterNonZeroData(doughnutData, labels, colors);

  // Legendda raqamlarni qo‘shish uchun labellarni o‘zgartirish
  const labelsWithValues = filteredLabels.map((label, index) => `${label}: ${filteredData[index]}`);

  const vazifalarStatusCtx = document.getElementById('vazifalarStatusGrafik').getContext('2d');
  let vazifalarChart = new Chart(vazifalarStatusCtx, {
    type: 'doughnut',
    data: {
      labels: labelsWithValues,
      datasets: [{
        data: filteredData,
        backgroundColor: filteredColors,
        borderWidth: 0,
        cutout: '50%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Moslashuvchanlik uchun
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            font: {
              size: 16 // Legenddagi matn kattaroq
            }
          }
        },
        tooltip: {
          enabled: true
        },
        datalabels: {
          color: '#fff',
          font: {
            size: 18, // Aylana ichidagi raqamlar kattaroq
            weight: 'bold'
          },
          formatter: (value) => value,
          anchor: 'center',
          align: 'center'
        }
      },
      cutoutPercentage: 60,
      onHover: (event, elements) => {
        const canvas = event.chart.canvas;
        canvas.style.cursor = elements.length ? 'pointer' : 'default';
      },
      layout: {
        padding: {
          top: 20,
          bottom: 20,
        }
      }
    }
  });

  // Umumiy vazifalar sonini yuqoridagi divga yozish
  const totalElement = document.querySelector('.vazifalar-status-statistika .total-value');
  if (totalElement) {
    totalElement.textContent = total;
  }

  // Hover effekti
  let currentIndex = 0;

  function simulateHover(index) {
    if (currentIndex >= 0 && currentIndex < filteredData.length) {
      if (vazifalarChart && vazifalarChart.data.datasets[0]) {
        vazifalarChart.data.datasets[0].offset = vazifalarChart.data.datasets[0].offset || new Array(vazifalarChart.data.datasets[0].data.length).fill(0);
        vazifalarChart.data.datasets[0].offset[currentIndex] = 0;
        vazifalarChart.update();
      }
    }

    currentIndex = index;
    if (currentIndex >= 0 && currentIndex < filteredData.length) {
      if (vazifalarChart && vazifalarChart.data.datasets[0]) {
        vazifalarChart.data.datasets[0].offset = vazifalarChart.data.datasets[0].offset || new Array(loyihalarChart.data.datasets[0].data.length).fill(0);
        vazifalarChart.data.datasets[0].offset[currentIndex] = 30;
        vazifalarChart.update();
      }
    }
  }

  // Avtomatik aylanishni boshlash
  setInterval(() => {
    simulateHover((currentIndex + 1) % filteredData.length);
  }, 1500);

  // Dastlabki holatni sozlash
  simulateHover(0);
}

// Grafikni ishga tushirish
initDoughnutChart();