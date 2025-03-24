// // Elementlarni olish
// const addUserTrigger = document.getElementById('addUserTrigger');
// const addUserModal = document.getElementById('addUserModal');
// const addUserForm = document.getElementById('addUserForm');
// const loginInput = document.getElementById('login');
// const userTableBody = document.getElementById('userTableBody');
// const editUserModal = document.getElementById('editUserModal');
// const editUserForm = document.getElementById('editUserForm');
// let currentUserId = null;

// // "Hodim ro‘yxatdan o‘tkazish" sarlavhasiga bosilganda modalni ochish
// addUserTrigger.addEventListener('click', () => {
//     addUserModal.style.display = 'block';
// });

// // Modalni yopish
// function closeAddModal() {
//     addUserModal.style.display = 'none';
//     addUserForm.reset(); // Formani tozalash
// }

// // Loginni real vaqtda tekshirish
// loginInput.addEventListener('input', async () => {
//     const username = loginInput.value;
//     if (username.length < 3) return; // Minimal uzunlik tekshiruvi

//     try {
//         const response = await fetch(`http://localhost:5000/api/check-username?username=${username}`);
//         const result = await response.json();
//         if (result.exists) {
//             loginInput.style.borderColor = 'red';
//             alert(result.message);
//         } else {
//             loginInput.style.borderColor = 'green';
//         }
//     } catch (error) {
//         console.error('Login tekshirishda xatolik:', error);
//     }
// });

// // Foydalanuvchilarni yuklash va jadvalda ko‘rsatish
// async function loadUsers() {
//     try {
//         const response = await fetch('http://localhost:5000/api/users');
//         if (!response.ok) {
//             throw new Error(`Server javobi: ${response.status} - ${await response.text()}`);
//         }
//         const users = await response.json();

//         // Agar users array bo‘lmasa, xato chiqaramiz
//         if (!Array.isArray(users)) {
//             throw new Error('Serverdan qaytgan ma\'lumotlar array emas: ' + JSON.stringify(users));
//         }

//         userTableBody.innerHTML = ''; // Jadvalni tozalash

//         users.forEach(user => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//                 <td>${user.id}</td>
//                 <td><a href="javascript:void(0)" class="fish-link" data-id="${user.id}">${user.FISH}</a></td>
//                 <td>${user.Bulim}</td>
//                 <td>${user.Lavozim}</td>
//                 <td>${user.username}</td>
//                 <td>${user.role}</td>
//                 <td>${new Date(user.created_at).toLocaleString()}</td>
//                 <td>
//                     <a href="javascript:void(0)" class="delete-btn" data-id="${user.id}">O‘chirish</a>
//                 </td>
//             `;
//             userTableBody.appendChild(row);
//         });

//         // F.I.Sh linklari va o‘chirish tugmalari uchun hodisalar qo‘shish
//         addEventListeners();
//     } catch (error) {
//         console.error('Foydalanuvchilarni yuklashda xatolik:', error);
//         alert('Foydalanuvchilarni yuklashda xatolik yuz berdi: ' + error.message);
//     }
// }

// // Modalni ochish va ma'lumotlarni to‘ldirish (tahrirlash uchun)
// function openModal(userId, user) {
//     currentUserId = userId;
//     document.getElementById('edit-fish').value = user.FISH;
//     document.getElementById('edit-bulim').value = user.Bulim;
//     document.getElementById('edit-lavozim').value = user.Lavozim;
//     document.getElementById('edit-login').value = user.username;
//     document.getElementById('edit-role').value = user.role;
//     document.getElementById('edit-password').value = ''; // Parol bo‘sh qoladi, faqat o‘zgartirish uchun
//     editUserModal.style.display = 'block';
// }

// // Modalni yopish (tahrirlash uchun)
// function closeModal() {
//     editUserModal.style.display = 'none';
//     currentUserId = null;
// }

// // Foydalanuvchi ma'lumotlarini olish
// async function fetchUser(userId) {
//     try {
//         const response = await fetch(`http://localhost:5000/api/user/${userId}`);
//         if (!response.ok) {
//             throw new Error('Foydalanuvchi topilmadi');
//         }
//         return await response.json();
//     } catch (error) {
//         console.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', error);
//         alert('Foydalanuvchi ma\'lumotlarini olishda xatolik yuz berdi.');
//         return null;
//     }
// }

// // Hodisalar qo‘shish
// function addEventListeners() {
//     // F.I.Sh linklariga hodisa qo‘shish
//     document.querySelectorAll('.fish-link').forEach(link => {
//         link.addEventListener('click', async (e) => {
//             const userId = e.target.getAttribute('data-id');
//             const response = await fetch('http://localhost:5000/api/users');
//             const users = await response.json();
//             const user = users.find(u => u.id == userId);
//             if (user) {
//                 openModal(userId, user);
//             }
//         });
//     });

//     // O‘chirish tugmasi
//     document.querySelectorAll('.delete-btn').forEach(button => {
//         button.addEventListener('click', async (e) => {
//             const userId = e.target.getAttribute('data-id');
//             if (confirm('Foydalanuvchini o‘chirishni tasdiqlaysizmi?')) {
//                 try {
//                     const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
//                         method: 'DELETE'
//                     });
//                     const result = await response.json();
//                     if (response.ok) {
//                         alert(result.message);
//                         loadUsers(); // Jadvalni yangilash
//                     } else {
//                         alert('Xatolik: ' + result.message);
//                     }
//                 } catch (error) {
//                     console.error('O‘chirishda xatolik:', error);
//                     alert('O‘chirishda xatolik yuz berdi.');
//                 }
//             }
//         });
//     });
// }

// // Modal formasi yuborilganda (tahrirlash uchun)
// editUserForm.addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const updatedUser = {
//         fish: document.getElementById('edit-fish').value,
//         bulim: document.getElementById('edit-bulim').value,
//         lavozim: document.getElementById('edit-lavozim').value,
//         login: document.getElementById('edit-login').value,
//         role: document.getElementById('edit-role').value,
//         newPassword: document.getElementById('edit-password').value || undefined // Agar parol bo‘sh bo‘lsa, undefined qilib yuboramiz
//     };

//     try {
//         // Ma'lumotlarni yangilash
//         const response = await fetch(`http://localhost:5000/api/users/${currentUserId}`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(updatedUser)
//         });
//         const result = await response.json();
//         if (!response.ok) {
//             throw new Error(result.message);
//         }

//         // Agar parol o‘zgartirilgan bo‘lsa, parolni yangilash
//         if (updatedUser.newPassword) {
//             const passwordResponse = await fetch(`http://localhost:5000/api/users/${currentUserId}/reset-password`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ newPassword: updatedUser.newPassword })
//             });
//             const passwordResult = await passwordResponse.json();
//             if (!passwordResponse.ok) {
//                 throw new Error(passwordResult.message);
//             }
//         }

//         alert('Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi!');
//         closeModal();
//         loadUsers(); // Jadvalni yangilash
//     } catch (error) {
//         console.error('Tahrirlashda xatolik:', error);
//         alert('Tahrirlashda xatolik yuz berdi: ' + error.message);
//     }
// });

// // Forma yuborilganda (yangi foydalanuvchi qo‘shish uchun)
// addUserForm.addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const newUser = {
//         fish: document.getElementById('fish').value,
//         bulim: document.getElementById('bulim').value,
//         lavozim: document.getElementById('lavozim').value,
//         login: document.getElementById('login').value,
//         password: document.getElementById('password').value,
//         role: document.getElementById('role').value,
//         created_at: new Date().toISOString()
//     };

//     console.log('Yuborilayotgan ma\'lumotlar:', newUser);

//     try {
//         const response = await fetch('http://localhost:5000/api/users', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(newUser)
//         });

//         const result = await response.json();
//         if (response.ok) {
//             alert('Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tkazildi!');
//             closeAddModal(); // Modalni yopish va formani tozalash
//             loadUsers(); // Jadvalni yangilash
//         } else {
//             console.error('Serverdan xatolik:', result);
//             alert(result.message);
//         }
//     } catch (error) {
//         console.error('Fetch xatolik:', error);
//         alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message);
//     }
// });

// // Sahifa yuklanganda foydalanuvchilarni yuklash
// document.addEventListener('DOMContentLoaded', loadUsers);

// // Modalni yopish uchun tashqariga bosish
// window.onclick = function(event) {
//     if (event.target == addUserModal) {
//         closeAddModal();
//     }
//     if (event.target == editUserModal) {
//         closeModal();
//     }
// };













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

// "Hodim ro‘yxatdan o‘tkazish" sarlavhasiga bosilganda modalni ochish
addUserTrigger.addEventListener('click', () => {
    addUserModal.style.display = 'block';
});

// Modalni yopish
function closeAddModal() {
    addUserModal.style.display = 'none';
    addUserForm.reset(); // Formani tozalash
}

// Loginni real vaqtda tekshirish
loginInput.addEventListener('input', async () => {
    const username = loginInput.value;
    if (username.length < 3) return; // Minimal uzunlik tekshiruvi

    try {
        const response = await fetch(`http://localhost:5000/api/check-username?username=${username}`);
        const result = await response.json();
        if (result.exists) {
            loginInput.style.borderColor = 'red';
            alert(result.message);
        } else {
            loginInput.style.borderColor = 'green';
        }
    } catch (error) {
        console.error('Login tekshirishda xatolik:', error);
    }
});

// Foydalanuvchilarni yuklash va jadvalda ko‘rsatish
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:5000/api/users');
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
        row.innerHTML = `
            <td>${user.id}</td>
            <td><a href="javascript:void(0)" class="fish-link" data-id="${user.id}">${user.FISH}</a></td>
            <td>${user.Bulim}</td>
            <td>${user.Lavozim}</td>
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
        return (
            user.id.toString().includes(searchTerm) ||
            user.FISH.toLowerCase().includes(searchTerm) ||
            user.Bulim.toLowerCase().includes(searchTerm) ||
            user.Lavozim.toLowerCase().includes(searchTerm) ||
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
    document.getElementById('edit-fish').value = user.FISH;
    document.getElementById('edit-bulim').value = user.Bulim;
    document.getElementById('edit-lavozim').value = user.Lavozim;
    document.getElementById('edit-login').value = user.username;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-password').value = ''; // Parol bo‘sh qoladi, faqat o‘zgartirish uchun
    editUserModal.style.display = 'block';
}

// Modalni yopish (tahrirlash uchun)
function closeModal() {
    editUserModal.style.display = 'none';
    currentUserId = null;
}

// Foydalanuvchi ma'lumotlarini olish
async function fetchUser(userId) {
    try {
        const response = await fetch(`http://localhost:5000/api/user/${userId}`);
        if (!response.ok) {
            throw new Error('Foydalanuvchi topilmadi');
        }
        return await response.json();
    } catch (error) {
        console.error('Foydalanuvchi ma\'lumotlarini olishda xatolik:', error);
        alert('Foydalanuvchi ma\'lumotlarini olishda xatolik yuz berdi.');
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
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    if (response.ok) {
                        alert(result.message);
                        loadUsers(); // Jadvalni yangilash
                    } else {
                        alert('Xatolik: ' + result.message);
                    }
                } catch (error) {
                    console.error('O‘chirishda xatolik:', error);
                    alert('O‘chirishda xatolik yuz berdi.');
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
            body: JSON.stringify(updatedUser)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }

        // Agar parol o‘zgartirilgan bo‘lsa, parolni yangilash
        if (updatedUser.newPassword) {
            const passwordResponse = await fetch(`http://localhost:5000/api/users/${currentUserId}/reset-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newPassword: updatedUser.newPassword })
            });
            const passwordResult = await passwordResponse.json();
            if (!passwordResponse.ok) {
                throw new Error(passwordResult.message);
            }
        }

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

    const newUser = {
        fish: document.getElementById('fish').value,
        bulim: document.getElementById('bulim').value,
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
            body: JSON.stringify(newUser)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Foydalanuvchi muvaffaqiyatli ro‘yxatdan o‘tkazildi!');
            closeAddModal(); // Modalni yopish va formani tozalash
            loadUsers(); // Jadvalni yangilash
        } else {
            console.error('Serverdan xatolik:', result);
            alert(result.message);
        }
    } catch (error) {
        console.error('Fetch xatolik:', error);
        alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message);
    }
});

// Sahifa yuklanganda foydalanuvchilarni yuklash
document.addEventListener('DOMContentLoaded', loadUsers);

// Modalni yopish uchun tashqariga bosish
window.onclick = function(event) {
    if (event.target == addUserModal) {
        closeAddModal();
    }
    if (event.target == editUserModal) {
        closeModal();
    }
};