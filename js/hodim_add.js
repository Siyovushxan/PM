// Foydalanuvchi qo‘shish formasini boshqarish
const addUserForm = document.getElementById('addUserForm');
const loginInput = document.getElementById('login');

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
            addUserForm.reset();
        } else {
            console.error('Serverdan xatolik:', result);
            alert(result.message);
        }
    } catch (error) {
        console.error('Fetch xatolik:', error);
        alert('Server bilan bog‘lanishda xatolik yuz berdi: ' + error.message);
    }
});