document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.project-form');
    const profileImage = document.getElementById('profile-image');
    const profileModal = document.getElementById('profile-modal');
    const profileFISH = document.getElementById('profile-fish');
    const profileBulim = document.getElementById('profile-bulim');
    const profileLavozim = document.getElementById('profile-lavozim');
    const logoutLink = document.getElementById('logout-link');

    // Foydalanuvchi ID sini olish
    function getUserId() {
        const userId = sessionStorage.getItem('userId');
        console.log('Olingan userId:', userId);
        return userId;
    }

    // Profilni yangilash (serverdan olish)
    function updateProfile() {
        const userId = getUserId();
        if (userId) {
            fetch(`http://localhost:5000/api/user/${userId}`)
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

    // Profil oynasini ochish/yopish
    if (profileImage) {
        profileImage.addEventListener('click', e => {
            e.preventDefault();
            profileModal.style.display =
                profileModal.style.display === 'block' ? 'none' : 'block';
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

    // Navbar havolasini boshqarish
    async function manageNavLinks() {
        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await fetch('http://localhost:5000/api/check-permission');
            if (!response.ok) {
                throw new Error('Ruxsatni tekshirishda xatolik: ' + response.statusText);
            }
            const data = await response.json();
            const addProjectLink = document.querySelector('a[href="loyiha_add.html"]');
            if (addProjectLink) {
                if (data.authorized) {
                    addProjectLink.style.display = 'inline-block'; // Admin uchun ko‘rsatish
                } else {
                    addProjectLink.style.display = 'none'; // User uchun yashirish
                }
            }
        } catch (error) {
            console.error('Navbardagi havolani boshqarishda xatolik:', error);
            const addProjectLink = document.querySelector('a[href="loyiha_add.html"]');
            if (addProjectLink) {
                addProjectLink.style.display = 'none';
            }
        }
    }

    // Sahifa yuklanganda profilni va ruxsatni tekshirish
    window.onload = async () => {
        const userId = getUserId();
        if (!userId) {
            console.log('User ID yo‘q, login.html ga o‘tish...');
            window.location.href = 'login.html';
        } else {
            updateProfile();
            manageNavLinks(); // Navbar havolasini boshqarish
            const form = document.querySelector('.project-form');
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

                    const projectData = {
                        name,
                        description,
                        startDate,
                        endDate,
                        status,
                        responsible,
                    };

                    try {
                        const response = await fetch('http://localhost:5000/api/projects', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(projectData),
                        });

                        const data = await response.json();
                        alert(data.message);
                        form.reset();
                    } catch (error) {
                        console.error('Xatolik:', error);
                        alert('Serverga ulanishda xatolik yuz berdi!');
                    }
                });
            }
        }
    };

    // Ortga qaytishni bloklash
    window.onpopstate = function (event) {
        const userId = getUserId();
        if (window.location.pathname.includes('loyiha_add.html') && userId) {
            history.replaceState(null, '', 'loyiha_add.html');
            return false;
        }
    };
});