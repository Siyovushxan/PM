// document.addEventListener('DOMContentLoaded', () => {
//     const form = document.querySelector('.project-form');
//     const profileImage = document.getElementById('profile-image');
//     const profileModal = document.getElementById('profile-modal');
//     const profileFISH = document.getElementById('profile-fish');
//     const profileBulim = document.getElementById('profile-bulim');
//     const profileLavozim = document.getElementById('profile-lavozim');
//     const logoutLink = document.getElementById('logout-link');
//     const addProjectLink = document.querySelector('a[href="loyiha_add.html"]');

//     // Foydalanuvchi ID sini login paytida saqlash uchun
//     function saveUserId(userId) {
//         sessionStorage.setItem('userId', userId);
//     }

//     // Foydalanuvchi ID sini olish
//     function getUserId() {
//         const userId = sessionStorage.getItem('userId');
//         return userId;
//     }

//     // Profilni yangilash (serverdan olish)
//     function updateProfile() {
//         const userId = getUserId();
//         if (userId) {
//             fetch(`http://localhost:5000/api/user/${userId}`)
//                 .then(response => {
//                     if (!response.ok) {
//                         throw new Error('Server xatosi: ' + response.status);
//                     }
//                     return response.json();
//                 })
//                 .then(data => {
//                     profileFISH.textContent = data.FISH || "Noma'lum";
//                     profileBulim.textContent = data.Bulim || "Noma'lum";
//                     profileLavozim.textContent = data.Lavozim || "Noma'lum";
//                 })
//                 .catch(error => {
//                     console.error("Ma'lumot olishda xatolik:", error);
//                     profileFISH.textContent = "Ma'lumot topilmadi";
//                     profileBulim.textContent = '';
//                     profileLavozim.textContent = '';
//                 });
//         } else {
//             console.log("User ID topilmadi, login.html ga yo'naltirilyapti...");
//             window.location.href = 'login.html';
//         }
//     }

//     // Navbar havolasini boshqarish (role asosida)
//     async function manageNavLinks() {
//         const userId = getUserId();
//         console.log('manageNavLinks ishga tushdi, userId:', userId);
//         if (!userId || !addProjectLink) {
//             console.log('User ID yo‘q yoki havola topilmadi, havolani yashirish...');
//             console.log('User ID:', userId);
//             console.log('Add Project Link:', addProjectLink);
//             if (addProjectLink) {
//                 addProjectLink.style.display = 'none';
//             }
//             return;
//         }

//         try {
//             console.log('Check-permission so‘rov yuborilmoqda...');
//             const response = await fetch('http://localhost:5000/api/check-permission', {
//                 method: 'GET',
//                 credentials: 'include', // Sessiya cookie'lari uchun
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             });

//             console.log('Check-permission javobi status:', response.status);
//             if (!response.ok) {
//                 const errorText = await response.text();
//                 console.log('Check-permission xato matni:', errorText);
//                 throw new Error(`Ruxsatni tekshirishda xatolik: ${response.status} (${response.statusText})`);
//             }

//             const data = await response.json();
//             console.log('Ruxsat tekshiruvi natijasi:', JSON.stringify(data));

//             if (data.authorized === true) {
//                 console.log('Foydalanuvchi admin, havola ko‘rsatilmoqda...');
//                 addProjectLink.style.display = 'inline-block'; // Admin uchun ko‘rsatish
//             } else {
//                 console.log('Foydalanuvchi admin emas, havola yashirilmoqda...');
//                 addProjectLink.style.display = 'none'; // Oddiy foydalanuvchi uchun yashirish
//             }
//         } catch (error) {
//             console.error('Navbardagi havolani boshqarishda xatolik:', error.message);
//             if (addProjectLink) {
//                 addProjectLink.style.display = 'none'; // Xatolikda yashirish
//             }
//         }
//     }

//     // Profil oynasini ochish/yopish
//     if (profileImage) {
//         profileImage.addEventListener('click', e => {
//             e.preventDefault();
//             profileModal.style.display = profileModal.style.display === 'block' ? 'none' : 'block';
//             if (profileModal.style.display === 'block') {
//                 history.replaceState(null, '', window.location.pathname);
//             }
//             updateProfile();
//         });
//     } else {
//         console.error('profile-image elementi topilmadi!');
//     }

//     // Yopish tugmasi
//     const closeBtn = document.querySelector('.close-btn');
//     if (closeBtn) {
//         closeBtn.addEventListener('click', () => {
//             profileModal.style.display = 'none';
//             history.replaceState(null, '', window.location.pathname);
//         });
//     } else {
//         console.error('close-btn elementi topilmadi!');
//     }

//     // Tizimdan chiqish havolasi uchun
//     if (logoutLink) {
//         logoutLink.addEventListener('click', e => {
//             e.preventDefault();
//             sessionStorage.removeItem('userId');
//             history.replaceState(null, '', 'login.html');
//             window.location.href = 'login.html';
//             history.pushState(null, '', 'login.html');
//         });
//     } else {
//         console.error('logout-link elementi topilmadi!');
//     }

//     // Loyiha qo‘shish formasi
//     if (form) {
//         form.addEventListener('submit', async event => {
//             event.preventDefault();
//             const name = document.getElementById('project-name').value;
//             const description = document.getElementById('project-description').value;
//             const startDate = document.getElementById('start-date').value;
//             const endDate = document.getElementById('end-date').value;
//             const status = document.getElementById('status').value;
//             const responsible = document.getElementById('statusMasul').value;

//             if (!name || !description || !startDate || !endDate || !status || !responsible) {
//                 alert('Iltimos, barcha maydonlarni to‘ldiring!');
//                 return;
//             }

//             const projectData = { name, description, startDate, endDate, status, responsible };

//             try {
//                 const response = await fetch('http://localhost:5000/api/projects', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify(projectData),
//                 });

//                 const data = await response.json();
//                 alert(data.message);
//                 form.reset();
//             } catch (error) {
//                 console.error('Xatolik:', error);
//                 alert('Serverga ulanishda xatolik yuz berdi!');
//             }
//         });
//     } else {
//         console.log('project-form elementi topilmadi! Formani tekshiring.');
//     }

//     // Ortga qaytishni faqat index.html va login.html uchun bloklash
//     window.onpopstate = function (event) {
//         const userId = getUserId();
//         if (window.location.pathname.includes('index.html') && userId) {
//             history.replaceState(null, '', 'index.html');
//             return false;
//         } else if (window.location.pathname.includes('login.html')) {
//             history.replaceState(null, '', 'login.html');
//             return false;
//         }
//     };

//     // Sahifa yuklanganda manageNavLinks ni chaqirish
//     manageNavLinks(); // Sahifa yuklanganda havolani boshqarish
//     updateProfile(); // Profilni yangilash
// });













document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.project-form');
    const profileImage = document.getElementById('profile-image');
    const profileModal = document.getElementById('profile-modal');
    const profileFISH = document.getElementById('profile-fish');
    const profileBulim = document.getElementById('profile-bulim');
    const profileLavozim = document.getElementById('profile-lavozim');
    const logoutLink = document.getElementById('logout-link');
    const addProjectLink = document.querySelector('a[href="loyiha_add.html"]');

    // Foydalanuvchi ID sini olish
    function getUserId() {
        return sessionStorage.getItem('userId');
    }

    // Profilni yangilash
    function updateProfile() {
        const userId = getUserId();
        if (userId) {
            fetch(`http://localhost:5000/api/user/${userId}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Server xatosi: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    profileFISH.textContent = data.FISH || "Noma'lum";
                    profileBulim.textContent = data.Bulim || "Noma'lum";
                    profileLavozim.textContent = data.Lavozim || "Noma'lum";
                })
                .catch(error => {
                    console.error("Ma'lumot olishda xatolik:", error);
                    profileFISH.textContent = "Ma'lumot topilmadi";
                    profileBulim.textContent = '';
                    profileLavozim.textContent = '';
                });
        } else {
            console.log("User ID topilmadi, login.html ga yo'naltirilyapti...");
            window.location.href = 'login.html';
        }
    }

    // index.js ichidagi manageNavLinks funksiyasi
    async function manageNavLinks() {
        const userId = sessionStorage.getItem('userId');
        console.log('manageNavLinks ishga tushdi, userId:', userId);
        const addProjectLink = document.querySelector('a[href="loyiha_add.html"]');
    
        if (!userId || !addProjectLink) {
            console.log('User ID yo‘q yoki havola topilmadi, userId:', userId, 'havola:', addProjectLink);
            if (addProjectLink) {
                addProjectLink.style.display = 'none';
            }
            return;
        }
    
        try {
            console.log('Check-permission so‘rov yuborilmoqda...');
            const response = await fetch('http://localhost:5000/api/check-permission', {
                method: 'GET',
                credentials: 'include', // Cookie'larni uzatish
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            console.log('Check-permission javobi status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.log('Check-permission xato matni:', errorText);
                throw new Error(`Ruxsatni tekshirishda xatolik: ${response.status} - ${errorText}`);
            }
    
            const data = await response.json();
            console.log('Ruxsat tekshiruvi natijasi:', JSON.stringify(data));
    
            if (data.authorized === true) {
                console.log('Foydalanuvchi admin, havola ko‘rsatilmoqda...');
                addProjectLink.style.display = 'inline-block';
            } else {
                console.log('Foydalanuvchi admin emas, havola yashirilmoqda...');
                addProjectLink.style.display = 'none';
            }
        } catch (error) {
            console.error('Navbardagi havolani boshqarishda xatolik:', error.message);
            if (addProjectLink) {
                addProjectLink.style.display = 'none';
            }
        }
    }

    // Profil oynasini ochish/yopish
    if (profileImage) {
        profileImage.addEventListener('click', e => {
            e.preventDefault();
            profileModal.style.display = profileModal.style.display === 'block' ? 'none' : 'block';
            if (profileModal.style.display === 'block') {
                history.replaceState(null, '', window.location.pathname);
            }
            updateProfile();
        });
    } else {
        console.error('profile-image elementi topilmadi!');
    }

    // Yopish tugmasi
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            profileModal.style.display = 'none';
            history.replaceState(null, '', window.location.pathname);
        });
    } else {
        console.error('close-btn elementi topilmadi!');
    }

    // Tizimdan chiqish havolasi uchun
    if (logoutLink) {
        logoutLink.addEventListener('click', e => {
            e.preventDefault();
            sessionStorage.removeItem('userId');
            history.replaceState(null, '', 'login.html');
            window.location.href = 'login.html';
            history.pushState(null, '', 'login.html');
        });
    } else {
        console.error('logout-link elementi topilmadi!');
    }

    // Loyiha qo‘shish formasi
    if (form) {
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const name = document.getElementById('project-name').value;
            const description = document.getElementById('project-description').value;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const status = document.getElementById('status').value;
            const responsible = document.getElementById('statusMasul').value;

            if (!name || !description || !startDate || !endDate || !status || !responsible) {
                alert('Iltimos, barcha maydonlarni to‘ldiring!');
                return;
            }

            const projectData = { name, description, startDate, endDate, status, responsible };

            try {
                const response = await fetch('http://localhost:5000/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(projectData),
                    credentials: 'include'
                });

                const data = await response.json();
                alert(data.message);
                form.reset();
            } catch (error) {
                console.error('Xatolik:', error);
                alert('Serverga ulanishda xatolik yuz berdi!');
            }
        });
    } else {
        console.log('project-form elementi topilmadi! Formani tekshiring.');
    }

    // Ortga qaytishni faqat index.html va login.html uchun bloklash
    window.onpopstate = function (event) {
        const userId = getUserId();
        if (window.location.pathname.includes('index.html') && userId) {
            history.replaceState(null, '', 'index.html');
            return false;
        } else if (window.location.pathname.includes('login.html')) {
            history.replaceState(null, '', 'login.html');
            return false;
        }
    };

    // Sahifa yuklanganda manageNavLinks ni chaqirish
    manageNavLinks();
    updateProfile();
});