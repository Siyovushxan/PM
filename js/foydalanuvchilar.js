// Elementlarni olish
const addUserTrigger = document.getElementById('addUserTrigger');
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');
const loginInput = document.getElementById('login');
const userTableBody = document.getElementById('userTableBody');
const editUserModal = document.getElementById('editUserModal');
const editUserForm = document.getElementById('editUserForm');
const searchInput = document.getElementById('searchInput');
let currentUserId = null;
let allUsers = []; // Barcha foydalanuvchilarni saqlash uchun
let allBulims = []; // Barcha bo‘limlarni saqlash uchun
let isUsernameAvailable = false; // Username mavjudligini kuzatish uchun

// "Hodim ro‘yxatdan o‘tkazish" sarlavhasiga bosilganda modalni ochish
addUserTrigger.addEventListener('click', () => {
    addUserModal.style.display = 'block';
});

// Modalni yopish
function closeAddModal() {
    addUserModal.style.display = 'none';
    addUserForm.reset(); // Formani tozalash
    isUsernameAvailable = false; // Reset qilish
    loginInput.style.borderColor = ''; // Border rangini tozalash
}

// Modalni yopish (tahrirlash uchun)
function closeModal() {
    editUserModal.style.display = 'none';
    currentUserId = null;
}

// Loginni real vaqtda tekshirish
loginInput.addEventListener('input', async () => {
    const username = loginInput.value;
    if (username.length < 3) {
        loginInput.style.borderColor = 'red';
        isUsernameAvailable = false;
        return; // Minimal uzunlik tekshiruvi
    }

    try {
        const response = await fetch(`http://localhost:5000/api/check-username?username=${username}`, {
            credentials: 'include' // Sessiya cookie-larini yuborish
        });
        if (!response.ok) {
            throw new Error(`Server javobi: ${response.status} - ${await response.text()}`);
        }
        const result = await response.json();
        if (result.exists) {
            loginInput.style.borderColor = 'red';
            alert(result.message);
            isUsernameAvailable = false;
        } else {
            loginInput.style.borderColor = 'green';
            isUsernameAvailable = true;
        }
    } catch (error) {
        console.error('Login tekshirishda xatolik:', error);
        loginInput.style.borderColor = 'red';
        isUsernameAvailable = false;
    }
});

// Bo‘limlarni serverdan yuklash va <select> maydonlarini to‘ldirish
async function loadBulims() {
    try {
        const response = await fetch('http://localhost:5000/api/bulims', {
            credentials: 'include' // Sessiya cookie-larini yuborish
        });
        if (!response.ok) {
            throw new Error(`Server javobi: ${response.status} - ${await response.text()}`);
        }
        const bulims = await response.json();

        // Bo‘limlar va Yuqori bo‘limlarni birlashtirish
        const uniqueBulims = new Set();
        bulims.forEach(bulim => {
            if (bulim.Bulim) uniqueBulims.add(bulim.Bulim);
            if (bulim.parent_bulim) uniqueBulims.add(bulim.parent_bulim);
        });
        allBulims = Array.from(uniqueBulims);

        // Add modal uchun Yuqori bo‘limni to‘ldirish
        const parentBulimSelect = document.getElementById('parent_bulim');
        parentBulimSelect.innerHTML = '<option value="">Yuqori bo‘limni tanlang (ixtiyoriy)</option>';
        allBulims.forEach(bulim => {
            const option = document.createElement('option');
            option.value = bulim;
            option.textContent = bulim;
            parentBulimSelect.appendChild(option);
        });

        // Edit modal uchun Yuqori bo‘limni to‘ldirish
        const editParentBulimSelect = document.getElementById('edit-parent_bulim');
        editParentBulimSelect.innerHTML = '<option value="">Yuqori bo‘limni tanlang (ixtiyoriy)</option>';
        allBulims.forEach(bulim => {
            const option = document.createElement('option');
            option.value = bulim;
            option.textContent = bulim;
            editParentBulimSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Bo‘limlarni yuklashda xatolik:', error);
        alert('Bo‘limlarni yuklashda xatolik yuz berdi: ' + error.message);
    }
}

// Foydalanuvchilarni yuklash va jadvalda ko‘rsatish
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:5000/api/users', {
            credentials: 'include' // Sessiya cookie-larini yuborish
        });
        if (!response.ok) {
            throw new Error(`Server javobi: ${response.status} - ${await response.text()}`);
        }
        allUsers = await response.json(); // Barcha foydalanuvchilarni saqlash

        // Agar users array bo‘lmasa, xato chiqaramiz
        if (!Array.isArray(allUsers)) {
            throw new Error('Serverdan qaytgan ma\'lumotlar array emas: ' + JSON.stringify(allUsers));
        }

        renderUsers(allUsers); // Foydalanuvchilarni ko‘rsatish
    } catch (error) {
        console.error('Foydalanuvchilarni yuklashda xatolik:', error);
        alert('Foydalanuvchilarni yuklashda xatolik yuz berdi: ' + error.message);
    }
}

// Foydalanuvchilarni jadvalda ko‘rsatish funksiyasi
function renderUsers(users) {
    userTableBody.innerHTML = ''; // Jadvalni tozalash

    users.forEach(user => {
        const row = document.createElement('tr');
        // Yuqori bo‘limni Bulim va parent_bulim birlashmasi sifatida ko‘rsatamiz
        const combinedBulim = user.bulim && user.parent_bulim ? `${user.bulim} / ${user.parent_bulim}` : user.bulim || user.parent_bulim || 'Yo‘q';
        row.innerHTML = `
            <td>${user.id}</td>
            <td><a href="javascript:void(0)" class="fish-link" data-id="${user.id}">${user.fish}</a></td>
            <td>${user.bulim}</td>
            <td>${combinedBulim}</td> <!-- Yuqori bo‘lim -->
            <td>${user.lavozim}</td>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
            <td>
                <a href="javascript:void(0)" class="delete-btn" data-id="${user.id}">O‘chirish</a>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    // F.I.Sh linklari va o‘chirish tugmalari uchun hodisalar qo‘shish
    addEventListeners();
}

// Qidiruv filtri
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => {
        // Yuqori bo‘limni qidiruv uchun birlashtiramiz
        const combinedBulim = user.bulim && user.parent_bulim ? `${user.bulim} / ${user.parent_bulim}` : user.bulim || user.parent_bulim || '';
        return (
            user.id.toString().includes(searchTerm) ||
            user.fish.toLowerCase().includes(searchTerm) ||
            user.bulim.toLowerCase().includes(searchTerm) ||
            combinedBulim.toLowerCase().includes(searchTerm) || // Yuqori bo‘lim bo'yicha qidiruv
            user.lavozim.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm) ||
            user.role.toLowerCase().includes(searchTerm) ||
            new Date(user.created_at).toLocaleString().toLowerCase().includes(searchTerm)
        );
    });

    renderUsers(filteredUsers); // Filtrlangan foydalanuvchilarni ko‘rsatish
});

// Modalni ochish va ma'lumotlarni to‘ldirish (tahrirlash uchun)
function openModal(userId, user) {
    currentUserId = userId;
    document.getElementById('edit-fish').value = user.fish;
    document.getElementById('edit-bulim').value = user.bulim;
    document.getElementById('edit-parent_bulim').value = user.parent_bulim || ''; // Yuqori bo‘lim
    document.getElementById('edit-lavozim').value = user.lavozim;
    document.getElementById('edit-login').value = user.username;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-password').value = ''; // Parol bo‘sh qoladi, faqat o‘zgartirish uchun
    editUserModal.style.display = 'block';
}

// Foydalanuvchi ma'lumotlarini olish
async function fetchUser(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
            credentials: 'include' // Sessiya cookie-larini yuborish
        });
        if (!response.ok) {
            throw new Error(`Server javobi: ${response.status} - ${await response.text()}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', error);
        alert('Foydalanuvchi ma\'lumotlarini olishda xatolik yuz berdi: ' + error.message);
        return null;
    }
}

// Hodisalar qo‘shish
function addEventListeners() {
    // F.I.Sh linklariga hodisa qo‘shish
    document.querySelectorAll('.fish-link').forEach(link => {
        link.addEventListener('click', async (e) => {
            const userId = e.target.getAttribute('data-id');
            const user = allUsers.find(u => u.id == userId);
            if (user) {
                openModal(userId, user);
            }
        });
    });

    // O‘chirish tugmasi
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.getAttribute('data-id');
            if (confirm('Foydalanuvchini o‘chirishni tasdiqlaysizmi?')) {
                try {
                    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                        method: 'DELETE',
                        credentials: 'include' // Sessiya cookie-larini yuborish
                    });
                    const result = await response.json();
                    if (response.ok) {
                        alert(result.message);
                        loadUsers(); // Jadvalni yangilash
                    } else {
                        throw new Error(result.message || 'O‘chirishda xatolik yuz berdi');
                    }
                } catch (error) {
                    console.error('O‘chirishda xatolik:', error);
                    alert('O‘chirishda xatolik yuz berdi: ' + error.message);
                }
            }
        });
    });
}

// Modal formasi yuborilganda (tahrirlash uchun)
editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedUser = {
        fish: document.getElementById('edit-fish').value,
        bulim: document.getElementById('edit-bulim').value,
        parent_bulim: document.getElementById('edit-parent_bulim').value || null, // Yuqori bo‘lim
        lavozim: document.getElementById('edit-lavozim').value,
        login: document.getElementById('edit-login').value,
        role: document.getElementById('edit-role').value,
        newPassword: document.getElementById('edit-password').value || undefined // Agar parol bo‘sh bo‘lsa, undefined qilib yuboramiz
    };

    try {
        // Ma'lumotlarni yangilash
        const response = await fetch(`http://localhost:5000/api/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Sessiya cookie-larini yuborish
            body: JSON.stringify(updatedUser)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                if (response.status === 401) {
                    alert('Sessiya tugadi. Iltimos, qayta tizimga kiring.');
                    window.location.href = '/login.html'; // Login sahifasiga yo'naltirish
                    return;
                }
                throw new Error(errorJson.message || 'Foydalanuvchi ma\'lumotlarini yangilashda xatolik yuz berdi');
            } catch (parseError) {
                throw new Error(`Server xatosi: ${response.status} - ${errorText}`);
            }
        }

        const result = await response.json();

        alert('Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
        closeModal();
        loadUsers(); // Jadvalni yangilash
    } catch (error) {
        console.error('Tahrirlashda xatolik:', error);
        alert('Tahrirlashda xatolik yuz berdi: ' + error.message);
    }
});

// Forma yuborilganda (yangi foydalanuvchi qo‘shish uchun)
addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Username mavjudligini tekshirish
    if (!isUsernameAvailable) {
        alert('Bu login allaqachon mavjud! Iltimos, boshqa login tanlang.');
        return;
    }

    const newUser = {
        fish: document.getElementById('fish').value,
        bulim: document.getElementById('bulim').value,
        parent_bulim: document.getElementById('parent_bulim').value || null, // Yuqori bo‘lim
        lavozim: document.getElementById('lavozim').value,
        login: document.getElementById('login').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value,
        created_at: new Date().toISOString()
    };

    console.log('Yuborilayotgan ma\'lumotlar:', newUser);

    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Sessiya cookie-larini yuborish
            body: JSON.stringify(newUser)
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || 'Foydalanuvchi qo‘shishda xatolik yuz berdi');
            } catch (parseError) {
                throw new Error(`Server xatosi: ${response.status} - ${errorText}`);
            }
        }

        const result = await response.json();
        alert('Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tkazildi!');
        closeAddModal(); // Modalni yopish va formani tozalash
        loadUsers(); // Jadvalni yangilash
        loadBulims(); // Bo‘limlarni qayta yuklash
    } catch (error) {
        console.error('Fetch xatolik:', error);
        alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message);
    }
});

// Sahifa yuklanganda foydalanuvchilarni va bo‘limlarni yuklash
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadBulims();
});

// Modalni yopish uchun tashqariga bosish
window.onclick = function(event) {
    if (event.target == addUserModal) {
        closeAddModal();
    }
    if (event.target == editUserModal) {
        closeModal();
    }
};