// Barcha bo‘limlarni saqlash uchun global o‘zgaruvchi
let allDepartments = [];

// Bo‘limlarni serverdan olish va jadvalga qo‘shish
async function fetchDepartments() {
    try {
        const response = await fetch('http://localhost:5000/api/departments');
        if (!response.ok) {
            throw new Error('Serverdan ma’lumot olishda xatolik yuz berdi');
        }
        const departments = await response.json();
        allDepartments = departments; // Barcha bo‘limlarni saqlaymiz
        renderDepartments(departments); // Jadvalni yangilaymiz
        updateTotalDepartments(departments.length); // Umumiy sonni yangilaymiz
        populateParentDepartmentSelect(departments); // Yuqori turuvchi bo‘limlar ro‘yxatini yangilaymiz
    } catch (error) {
        console.error('Bo‘limlarni olishda xatolik:', error);
        alert('Bo‘limlarni yuklashda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.');
    }
}

// Yuqori turuvchi bo‘limlar uchun select elementini to‘ldirish
function populateParentDepartmentSelect(departments) {
    const parentSelect = document.getElementById('parent-department');
    if (parentSelect) {
        parentSelect.innerHTML = '<option value="">Hech qaysi</option>'; // Default opsiya
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department.id;
            option.textContent = department.name_uz; // O‘zbekcha nomini ko‘rsatamiz
            parentSelect.appendChild(option);
        });
    }
}

// Bo‘limlarni jadvalga render qilish
function renderDepartments(departments) {
    const tbody = document.getElementById('departments-tbody');
    tbody.innerHTML = ''; // Jadvalni tozalash

    departments.forEach((department, index) => {
        const row = document.createElement('tr');
        // Yuqori turuvchi bo‘lim nomini topish
        const parentDepartment = department.parent_department_id
            ? departments.find(d => d.id === department.parent_department_id)?.name_uz || 'Noma’lum'
            : 'Hech qaysi';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="department-name">${department.name_uz}</td>
            <td>${department.name_ru}</td>
            <td>${department.name_en}</td>
            <td>${parentDepartment}</td>
            <td><button class="btn-delete" data-id="${department.id}">O‘chirish</button></td>
        `;

        // Tahrirlash uchun addEventListener qo‘shish
        const departmentNameCell = row.querySelector('.department-name');
        departmentNameCell.addEventListener('click', () => {
            openEditDepartmentModal(department.id, department.name_uz, department.name_ru, department.name_en, department.parent_department_id);
        });

        // O‘chirish tugmasi uchun addEventListener qo‘shish
        const deleteButton = row.querySelector('.btn-delete');
        deleteButton.addEventListener('click', () => {
            deleteDepartment(department.id);
        });

        tbody.appendChild(row);
    });
}

// Umumiy bo‘limlar sonini yangilash
function updateTotalDepartments(count) {
    const totalElement = document.getElementById('total-departments-count');
    if (totalElement) {
        totalElement.textContent = count;
    }
}

// Strukturani daraxt shaklida qurish uchun rekursiv funksiya
function buildDepartmentTree(departmentId, departments, level = 0) {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return '';

    // Bo‘limni HTML sifatida qaytarish
    let html = `<div class="tree-node" style="margin-left: ${level * 20}px;">${department.name_uz}</div>`;

    // Ushbu bo‘limning pastki bo‘limlarini topish
    const children = departments.filter(d => d.parent_department_id === departmentId);
    if (children.length > 0) {
        html += '<div class="tree-children">';
        children.forEach(child => {
            html += buildDepartmentTree(child.id, departments, level + 1);
        });
        html += '</div>';
    }

    return html;
}

// Barcha bo‘limlar ierarxiyasini qurish
function buildFullDepartmentTree(departments) {
    // Yuqori turuvchi bo‘limlarni topish (parent_department_id NULL bo‘lganlar)
    const topLevelDepartments = departments.filter(d => !d.parent_department_id);
    let html = '';

    topLevelDepartments.forEach(department => {
        html += buildDepartmentTree(department.id, departments);
    });

    return html;
}

// Struktura modalini ochish
// Struktura modalini ochish
function openStructureModal() {
    const modal = document.getElementById('structure-modal');
    const treeContainer = document.getElementById('structure-tree');
    const title = document.getElementById('structure-modal-title');

    if (modal && treeContainer && title) {
        title.textContent = 'Bo‘limlar struktura';
        // Barcha bo‘limlar ierarxiyasini qurish
        let treeHtml = buildFullDepartmentTree(allDepartments);

        // Agar serverdan ma'lumotlar yetarli bo‘lmasa, test uchun qo‘shimcha kontent qo‘shamiz
        if (!treeHtml || allDepartments.length < 10) {
            console.warn('Serverdan yetarli ma\'lumot kelmadi, test uchun qo‘shimcha kontent qo‘shilmoqda...');
            treeHtml = '';
            // Test uchun 20 ta bo‘lim qo‘shamiz
            for (let i = 1; i <= 20; i++) {
                treeHtml += `
                    <div class="tree-node" style="margin-left: ${i % 5 * 20}px;">
                        Test Bo‘lim ${i}
                        ${i % 5 !== 0 ? '<div class="tree-children"></div>' : ''}
                    </div>
                `;
            }
        }

        treeContainer.innerHTML = treeHtml;
        modal.style.display = 'flex';
        // Body skrollini o‘chirish
        document.body.style.overflow = 'hidden';
    }
}

// Struktura modalini yopish
function closeStructureModal() {
    const modal = document.getElementById('structure-modal');
    if (modal) {
        modal.style.display = 'none';
        // Body skrollini qayta yoqish
        document.body.style.overflow = 'auto';
    }
}

// Modalni ochish (yangi bo‘lim qo‘shish uchun)
function openAddDepartmentModal() {
    const modal = document.getElementById('department-modal');
    const form = document.getElementById('department-form');
    const title = document.getElementById('modal-title');

    if (modal && form && title) {
        title.textContent = 'Yangi bo‘lim qo‘shish';
        form.reset(); // Formani tozalash
        form.dataset.mode = 'add';
        form.dataset.id = '';
        const parentSelect = document.getElementById('parent-department');
        if (parentSelect) {
            parentSelect.value = ''; // Default sifatida "Hech qaysi" tanlanadi
        }
        modal.style.display = 'flex';
        // Body skrollini o‘chirish
        document.body.style.overflow = 'hidden';
    }
}

// Modalni ochish (tahrirlash uchun)
function openEditDepartmentModal(id, name_uz, name_ru, name_en, parent_department_id) {
    const modal = document.getElementById('department-modal');
    const form = document.getElementById('department-form');
    const title = document.getElementById('modal-title');

    if (modal && form && title) {
        title.textContent = 'Bo‘limni tahrirlash';
        document.getElementById('department-name-uz').value = name_uz;
        document.getElementById('department-name-ru').value = name_ru;
        document.getElementById('department-name-en').value = name_en;
        const parentSelect = document.getElementById('parent-department');
        if (parentSelect) {
            parentSelect.value = parent_department_id || ''; // Yuqori turuvchi bo‘limni tanlash
        }
        form.dataset.mode = 'edit';
        form.dataset.id = id;
        modal.style.display = 'flex';
        // Body skrollini o‘chirish
        document.body.style.overflow = 'hidden';
    }
}

// Modalni yopish
function closeDepartmentModal() {
    const modal = document.getElementById('department-modal');
    if (modal) {
        modal.style.display = 'none';
        // Body skrollini qayta yoqish
        document.body.style.overflow = 'auto';
    }
}

// Bo‘lim qo‘shish yoki tahrirlash
function handleDepartmentFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const mode = form.dataset.mode;
    const id = form.dataset.id;
    const name_uz = document.getElementById('department-name-uz').value.trim();
    const name_ru = document.getElementById('department-name-ru').value.trim();
    const name_en = document.getElementById('department-name-en').value.trim();
    const parent_department_id = document.getElementById('parent-department').value || null;

    if (!name_uz || !name_ru || !name_en) {
        alert('Iltimos, barcha tillardagi bo‘lim nomlarini kiriting!');
        return;
    }

    const departmentData = { name_uz, name_ru, name_en, parent_department_id };

    const url = mode === 'add' ? 'http://localhost:5000/api/departments' : `http://localhost:5000/api/departments/${id}`;
    const method = mode === 'add' ? 'POST' : 'PUT';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentData)
    })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                alert(result.message);
                closeDepartmentModal();
                fetchDepartments();
            } else {
                alert('Xatolik: ' + (result.error || 'Noma’lum xatolik'));
            }
        })
        .catch(error => {
            console.error('Bo‘lim qo‘shish/tahrirlashda xatolik:', error);
            alert('Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.');
        });
}

// Bo‘limni o‘chirish
async function deleteDepartment(id) {
    if (!confirm('Bu bo‘limni o‘chirishni tasdiqlaysizmi?')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/departments/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fetchDepartments();
        } else {
            alert(result.message || 'Bo‘limni o‘chirishda xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Bo‘limni o‘chirishda xatolik:', error);
        alert('Xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko‘ring.');
    }
}

// Qidiruv funksiyasi
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredDepartments = allDepartments.filter((department, index) => {
        const parentDepartmentName = department.parent_department_id
            ? allDepartments.find(d => d.id === department.parent_department_id)?.name_uz?.toLowerCase() || ''
            : '';
        return (
            (index + 1).toString().includes(searchTerm) ||
            department.name_uz.toLowerCase().includes(searchTerm) ||
            department.name_ru.toLowerCase().includes(searchTerm) ||
            department.name_en.toLowerCase().includes(searchTerm) ||
            parentDepartmentName.includes(searchTerm)
        );
    });
    renderDepartments(filteredDepartments);
    updateTotalDepartments(filteredDepartments.length);
}

// Hodisalarni ulash
function initializeEventListeners() {
    const departmentForm = document.getElementById('department-form');
    if (departmentForm) {
        departmentForm.addEventListener('submit', handleDepartmentFormSubmit);
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const addButton = document.querySelector('.btn-add');
    if (addButton) {
        addButton.addEventListener('click', openAddDepartmentModal);
    }

    const structureButton = document.querySelector('.btn-structure');
    if (structureButton) {
        structureButton.addEventListener('click', openStructureModal);
    }

    const closeButton = document.querySelector('.btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeDepartmentModal);
    }
}

// Sahifa yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
    fetchDepartments();
    initializeEventListeners();
});