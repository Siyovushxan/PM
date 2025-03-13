// Foydalanuvchi ID sini olish
function getUserId() {
    const userId = sessionStorage.getItem('userId');
    console.log('Olingan userId:', userId);
    return userId;
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
    }
}

// Profilni yangilash
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
                const profileFISH = document.getElementById('profile-fish');
                const profileBulim = document.getElementById('profile-bulim');
                const profileLavozim = document.getElementById('profile-lavozim');
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

// Profil oynasini boshqarish
function setupProfile() {
    const profileImage = document.getElementById('profile-image');
    const profileModal = document.getElementById('profile-modal');
    const closeBtn = document.querySelector('.close-btn');
    const logoutLink = document.getElementById('logout-link');

    if (profileImage) {
        profileImage.addEventListener('click', e => {
            e.preventDefault();
            profileModal.style.display = profileModal.style.display === 'block' ? 'none' : 'block';
            if (profileModal.style.display === 'block') {
                history.replaceState(null, '', window.location.pathname);
            }
            updateProfile();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            profileModal.style.display = 'none';
            history.replaceState(null, '', window.location.pathname);
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', e => {
            e.preventDefault();
            sessionStorage.removeItem('userId');
            history.replaceState(null, '', 'login.html');
            window.location.href = 'login.html';
            history.pushState(null, '', 'login.html');
        });
    }
}