document.addEventListener('DOMContentLoaded', () => {
    // Navbar va profil funksiyalarini ishga tushirish
    manageNavLinks();
    setupProfile();

    // Rolga asoslangan ruxsatni tekshirish
    async function checkPermission() {
        const userId = getUserId();
        if (!userId) {
            window.location.href = 'login.html';
            return false;
        }

        try {
            const response = await fetch('http://localhost:5000/api/check-permission');
            if (!response.ok) {
                throw new Error('Ruxsatni tekshirishda xatolik: ' + response.statusText);
            }
            const data = await response.json();
            if (!data.authorized) {
                alert('Sizda loyiha qo‘shish uchun ruxsat yo‘q! Iltimos, administrator bilan bog‘laning.');
                window.location.href = 'index.html';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Ruxsatni tekshirishda xatolik:', error);
            window.location.href = 'index.html';
            return false;
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
            const hasPermission = await checkPermission();
            if (hasPermission) {
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