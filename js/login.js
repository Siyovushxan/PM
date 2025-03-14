// document.addEventListener('DOMContentLoaded', () => {
//     const loginForm = document.querySelector('form'); // Formani topish (sizning HTML’da forma bo‘lishi kerak)

//     if (loginForm) {
//         loginForm.addEventListener('submit', async (e) => {
//             e.preventDefault();

//             const username = document.querySelector('input[type="text"]').value; // Username input
//             const password = document.querySelector('input[type="password"]').value; // Password input

//             if (!username || !password) {
//                 alert('Iltimos, login va parolni kiriting!');
//                 return;
//             }

//             try {
//                 const response = await fetch('http://localhost:5000/api/login', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     credentials: 'include', // Sessiya cookie’lari uchun
//                     body: JSON.stringify({ username, password }),
//                 });

//                 const data = await response.json();
//                 if (response.ok) {
//                     // Muvaffaqiyatli login bo‘lsa, userId ni saqlash
//                     if (data.userId) {
//                         sessionStorage.setItem('userId', data.userId); // userId ni saqlash
//                         window.location.href = 'index.html'; // Index.html ga o‘tish
//                     } else {
//                         alert('Login muvaffaqiyatli, lekin userId topilmadi!');
//                     }
//                 } else {
//                     alert(data.message || 'Login yoki parol noto‘g‘ri!');
//                 }
//             } catch (error) {
//                 console.error('Login so‘rovida xatolik:', error);
//                 alert('Serverga ulanishda xatolik yuz berdi!');
//             }
//         });
//     } else {
//         console.error('Login formasi topilmadi!');
//     }
// });









document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.querySelector('input[type="text"]').value;
            const password = document.querySelector('input[type="password"]').value;

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
                    credentials: 'include', // Sessiya cookie'lari uchun
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();
                console.log('Login javobi:', data); // Javobni ko'rish
                if (response.ok) {
                    if (data.userId) {
                        sessionStorage.setItem('userId', data.userId); // userId ni saqlash
                        console.log('userId saqlandi:', data.userId);
                        window.location.href = 'index.html'; // Index.html ga o‘tish
                    } else {
                        alert('Login muvaffaqiyatli, lekin userId topilmadi!');
                    }
                } else {
                    alert(data.message || 'Login yoki parol noto‘g‘ri!');
                }
            } catch (error) {
                console.error('Login so‘rovida xatolik:', error);
                alert('Serverga ulanishda xatolik yuz berdi!');
            }
        });
    } else {
        console.error('Login formasi topilmadi!');
    }
});