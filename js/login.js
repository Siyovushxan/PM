// document.addEventListener('DOMContentLoaded', () => {
//     const loginForm = document.getElementById('login-form');

//     if (!loginForm) {
//         console.error('Login formasi topilmadi! ID ni tekshiring: login-form');
//         return;
//     }

//     loginForm.addEventListener('submit', async (e) => {
//         e.preventDefault();

//         const username = document.getElementById('login-username').value;
//         const password = document.getElementById('login-password').value;

//         if (!username || !password) {
//             alert('Iltimos, login va parolni kiriting!');
//             return;
//         }

//         try {
//             console.log('Login so‘rovi jo‘natilmoqda:', { username, password });
//             const response = await fetch('http://localhost:5000/api/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 credentials: 'include', // Sessiya cookie’lari uchun
//                 body: JSON.stringify({ username, password }),
//             });

//             if (!response.ok) {
//                 const errorText = await response.text();
//                 throw new Error(`Login xatolik: ${response.status} - ${errorText}`);
//             }

//             const data = await response.json();
//             console.log('Server javobi:', data);

//             if (data.userId) {
//                 sessionStorage.setItem('userId', data.userId);
//                 console.log('userId saqlandi:', data.userId);
//                 alert(data.message);
//                 window.location.href = 'index.html'; // index.html ga o‘tish
//             } else {
//                 alert('Login muvaffaqiyatli, lekin userId topilmadi!');
//             }
//         } catch (error) {
//             console.error('Login xatolik:', error.message);
//             alert('Tizimga kirishda xatolik yuz berdi: ' + error.message);
//         }
//     });
// });







document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        console.error('Login formasi topilmadi! ID ni tekshiring: login-form');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('Iltimos, login va parolni kiriting!');
            return;
        }

        try {
            console.log('Login so‘rovi jo‘natilmoqda:', { username, password });
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Sessiya cookie’lari uchun
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Login xatolik: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Server javobi:', data);

            if (data.userId) {
                sessionStorage.setItem('userId', data.userId);
                console.log('userId saqlandi:', data.userId);
                alert(data.message);
                window.location.href = 'index.html'; // index.html ga o‘tish
            } else {
                alert('Login muvaffaqiyatli, lekin userId topilmadi!');
            }
        } catch (error) {
            console.error('Login xatolik:', error.message);
            alert('Tizimga kirishda xatolik yuz berdi: ' + error.message);
        }
    });
});