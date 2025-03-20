document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.project-form');

    // Foydalanuvchi ID sini olish
    function getUserId() {
        const userId = sessionStorage.getItem('userId');
        console.log('Olingan userId:', userId);
        return userId;
    }

    // Profilni yangilash
    function updateProfile() {
        const userId = getUserId();
        if (userId) {
            fetch(`http://localhost:5000/api/user/${userId}`)
                .then(response => {
                    console.log('Profil fetch status:', response.status);
                    if (!response.ok) throw new Error('Server xatosi: ' + response.status);
                    return response.json();
                })
                .then(data => {
                    document.getElementById('profile-fish').textContent = data.FISH || "Noma'lum";
                    document.getElementById('profile-bulim').textContent = data.Bulim || "Noma'lum";
                    document.getElementById('profile-lavozim').textContent = data.Lavozim || "Noma'lum";
                })
                .catch(error => {
                    console.error("Ma'lumot olishda xatolik:", error);
                    document.getElementById('profile-fish').textContent = "Ma'lumot topilmadi";
                    document.getElementById('profile-bulim').textContent = '';
                    document.getElementById('profile-lavozim').textContent = '';
                });
        }
    }

    // Rolni tekshirish va menyuni yangilash
    function updateNavbarBasedOnRole() {
        const userId = getUserId();
        if (!userId) {
            console.log('User ID yo‘q, login.html ga o‘tish...');
            window.location.href = 'login.html';
            return;
        }

        // userId ni query parametri sifatida yuboramiz
        fetch(`http://localhost:5000/api/check-permission?userId=${userId}`)
            .then(response => {
                console.log('Check-permission status:', response.status);
                if (!response.ok) {
                    throw new Error('Sessiya xatosi: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Check-permission data:', data);
                const role = data.role || 'user';
                const navbarLinks = document.querySelector('.navbar-links');

                if (navbarLinks) {
                    navbarLinks.innerHTML = '';
                    // Umumiy sahifalar (tartib o‘zgartirildi: loyiha_add.html dan oldin)
                    const commonLinks = `
                        <li><a href="index.html" class="nav-link">Bosh sahifa</a></li>
                        <li><a href="loyihalar.html" class="nav-link">Loyihalar</a></li>
                    `;
                    const profileSection = `
                        <li class="nav-link">
                            <img id="profile-image" src="img/user (1).png" alt="Profil rasmi" style="background-color: hsl(0, 0%, 100%);">
                            <div id="profile-modal" class="profile-modal">
                                <span class="close-btn" onclick="toggleProfile()">×</span>
                                <div class="modal-content">
                                    <h3 id="profile-fish">Lorem ipsum dolor sit amet.</h3>
                                    <p id="profile-bulim">Lorem ipsum dolor sit amet.</p>
                                    <p id="profile-lavozim">Lorem ipsum dolor sit amet.</p>
                                    <div>
                                        <img src="img/logout.png" alt="">
                                        <a id="logout-link" href="login.html">Tizimdan chiqish</a>
                                    </div>
                                </div>
                            </div>
                        </li>
                    `;

                    if (role === 'admin') {
                        // Admin uchun: loyiha_add.html ni yul_xaritalari.html dan oldin qo‘yamiz
                        navbarLinks.innerHTML = `
                            <li><a href="index.html" class="nav-link">Bosh sahifa</a></li>
                            <li><a href="loyihalar.html" class="nav-link">Loyihalar</a></li>
                            <li><a href="loyiha_add.html" class="nav-link">Loyiha qo'shish</a></li>
                            ${profileSection}
                        `;
                    } else {
                        // User uchun: loyiha_add.html yo‘q
                        navbarLinks.innerHTML = `${commonLinks}${profileSection}`;
                    }
                    reattachEventListeners();
                }
            })
            .catch(error => {
                console.error('Rolni tekshirishda xatolik:', error);
                sessionStorage.removeItem('userId');
                window.location.href = 'login.html';
            });
    }

    // Event listenerlarni qayta ulash
    function reattachEventListeners() {
        const profileImage = document.getElementById('profile-image');
        const profileModal = document.getElementById('profile-modal');
        const logoutLink = document.getElementById('logout-link');
        const closeBtn = document.querySelector('.close-btn');

        if (profileImage) {
            profileImage.addEventListener('click', e => {
                e.preventDefault();
                profileModal.style.display = profileModal.style.display === 'block' ? 'none' : 'block';
                if (profileModal.style.display === 'block') updateProfile();
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                profileModal.style.display = 'none';
            });
        }
        if (logoutLink) {
            logoutLink.addEventListener('click', e => {
                e.preventDefault();
                sessionStorage.removeItem('userId');
                window.location.href = 'login.html';
            });
        }
    }

    window.toggleProfile = function () {
        const profileModal = document.getElementById('profile-modal');
        profileModal.style.display = profileModal.style.display === 'block' ? 'none' : 'block';
    };

    // Sahifa yuklanganda
    window.onload = () => {
        updateNavbarBasedOnRole();
    };

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
});