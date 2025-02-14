// Formani olish
const projectForm = document.querySelector('.project-form');

// Loyihalarni localStorage'ga qo'shish
projectForm.addEventListener('submit', function (e) {
  e.preventDefault(); // Formani yuborishni to'xtatish

  // Formadagi ma'lumotlarni olish
  const projectName = document.querySelector('#project-name').value;
  const projectDescription = document.querySelector('#project-description').value;
  const startDate = document.querySelector('#start-date').value;
  const endDate = document.querySelector('#end-date').value;
  const status = document.querySelector('#status').value;

  // LocalStorage'dan mavjud loyihalarni olish yoki bo'sh massiv yaratish
  const projects = JSON.parse(localStorage.getItem('projects')) || [];

  // Yangi loyiha obyektini yaratish
  const newProject = {
    id: Date.now(), // Loyihaning noyob ID'si
    name: projectName,
    description: projectDescription,
    startDate: startDate,
    endDate: endDate,
    status: status
  };

  // Yangi loyihani massivga qo'shish
  projects.push(newProject);

  // Yangi massivni localStorage'ga saqlash
  localStorage.setItem('projects', JSON.stringify(projects));

  // Xabar berish
  alert('Loyiha muvaffaqiyatli qo\'shildi!');

  // Formani tozalash
  projectForm.reset();
});
