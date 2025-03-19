document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        console.error("Login form topilmadi! HTML da 'login-form' ID si mavjudligini tekshiring.");
        return;
    }

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            alert('Iltimos, login va parolni kiriting!');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Server xatosi: ' + response.status + ' - ' + errorText);
            }

            const data = await response.json();
            console.log('Login javobi:', data);

            if (response.ok) {
                alert(data.message);
                sessionStorage.setItem('userId', data.userId); // userId ni saqlash
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Tizimga kirish muvaffaqiyatsiz!');
            }
        } catch (error) {
            console.error('Login xatolik:', error.message);
            alert('Tizimga kirishda xatolik yuz berdi: ' + error.message);
        }
    });
});