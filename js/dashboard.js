const loyihalarCtx = document.getElementById('loyihalarGrafik').getContext('2d')
let loyihalarChart = new Chart(loyihalarCtx, {
	type: 'doughnut',
	data: {
		labels: [
			'Umumiy loyihalar soni',
			'Yakunlangan loyihalar soni',
			'Bajarilayotgan loyihalar soni',
			'Aktiv loyihalar soni',
			'To‘xtatilgan loyihalar soni',
		],
		datasets: [
			{
				data: [30, 10, 5, 10, 5], // Namunaviy qiymatlar
				backgroundColor: [
					'#3498db',
					'#2ecc71',
					'#e74c3c',
					'#9b59b6',
					'#f1c40f',
				],
				borderWidth: 0,
				cutout: '50%',
			},
			{
				data: [50], // Markaz
				backgroundColor: ['#27ae60'],
				borderWidth: 0,
			},
		],
	},
	options: {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				enabled: false,
			},
		},
		cutoutPercentage: 50,
		onHover: (event, elements) => {
			const canvas = event.chart.canvas
			canvas.style.cursor = elements.length ? 'pointer' : 'default'
		},
	},
})

// Klik hodisasi (avvalgi funksiya saqlanadi)
const grafikContainer = document.querySelector('.grafik-container')
grafikContainer.addEventListener('click', function () {
	grafikContainer.classList.toggle('toxtagan')
})

// Hover effekti uchun
const belgilar = document.querySelectorAll('.belgi')
belgilar.forEach((belgi, belgiIndex) => {
	belgi.addEventListener('mouseover', function () {
		const index = parseInt(this.getAttribute('data-index'))
		grafikContainer.classList.add('hover-toxtagan') // Hoverda grafik to‘xtaydi

		const ctx = loyihalarChart.ctx
		const chartArea = loyihalarChart.chartArea
		const centerX = (chartArea.left + chartArea.right) / 2
		const centerY = (chartArea.top + chartArea.bottom) / 2
		const radius = ((chartArea.right - chartArea.left) / 2) * 0.8 // Tashqi radiusning 80%
		const angle = (2 * Math.PI * index) / belgilar.length - Math.PI / 2
		const endX = centerX + radius * Math.cos(angle)
		const endY = centerY + radius * Math.sin(angle)

		// Chiziqni tasvirdagi yo‘nalishda chizish
		ctx.beginPath()
		ctx.moveTo(endX, endY)
		// Matnning Y koordinatasiga moslashtirish
		const belgiRect = belgi.getBoundingClientRect()
		const canvasRect = loyihalarChart.canvas.getBoundingClientRect()
		const matnY = belgiRect.top + belgiRect.height / 2 - canvasRect.top
		ctx.lineTo(ctx.canvas.width + 20, matnY) // Chiziq matnning o‘rtasiga boradi
		ctx.lineWidth = 2
		ctx.strokeStyle = '#ff0000'
		ctx.stroke()

		// Segmentni qalqib chiqarish
		loyihalarChart.data.datasets[0].data.forEach((_, i) => {
			if (i === index) {
				loyihalarChart.data.datasets[0].offset =
					loyihalarChart.data.datasets[0].offset || []
				loyihalarChart.data.datasets[0].offset[i] = 20 // 3D qalqish effekti
			} else {
				loyihalarChart.data.datasets[0].offset[i] = 0 // Boshqa segmentlarni qaytarish
			}
		})
		loyihalarChart.update()

		this.classList.add('hover-aktiv')
	})

	belgi.addEventListener('mouseout', function () {
		grafikContainer.classList.remove('hover-toxtagan') // Aylanishni qayta boshlash
		this.classList.remove('hover-aktiv')
		const ctx = loyihalarChart.ctx
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) // Chiziqni o‘chirish
		loyihalarChart.data.datasets[0].offset =
			loyihalarChart.data.datasets[0].offset.map(() => 0) // Qalqishni o‘chirish
		loyihalarChart.render() // Grafikni qayta chizish
	})
})
