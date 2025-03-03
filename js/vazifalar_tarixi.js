// document.addEventListener('DOMContentLoaded', () => {
//     const taskList = document.getElementById('task-list');
//     const modal = document.getElementById('task-modal-tarix');
//     const chatHistory = document.getElementById('chat-history');
//     const messageInput = document.getElementById('message-input');
//     const fileUpload = document.getElementById('file-upload');
//     const userFish = document.getElementById('user-fish');
//     const closeModalBtn = document.querySelector('.close-modal');
//     const sendButton = document.querySelector('button[onclick="sendMessage()"]');

//     let currentTaskId = null; // Global taskId ni saqlash
//     const currentUserId = sessionStorage.getItem('userId') || '#123524'; // Random ID sifatida
//     const serverUrl = 'http://localhost:5000'; // Server portini aniq belgilash

//     // Vaqtni DD.MM.YYYY HH:mm formatiga o'zgartirish funksiyasi
//     function formatDateTime(dateString) {
//         if (!dateString) return 'N/A';
//         const date = new Date(dateString);
//         if (isNaN(date.getTime())) return 'N/A';
//         const day = String(date.getDate()).padStart(2, '0');
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const year = date.getFullYear();
//         const hours = String(date.getHours()).padStart(2, '0');
//         const minutes = String(date.getMinutes()).padStart(2, '0');
//         return `${day}.${month}.${year} ${hours}:${minutes}`;
//     }

//     // Foydalanuvchi FISH ni random ID bilan almashtirish
//     function getUserFish() {
//         return Promise.resolve(currentUserId); // FISH o'rniga #123524
//     }

//     // Modalni vazifalar.js dan signal orqali ochish
//     if (taskList) {
//         taskList.addEventListener('modalOpen', (e) => {
//             currentTaskId = e.taskId; // Global o'zgaruvchiga saqlash
//             console.log('Modal ochildi, currentTaskId:', currentTaskId); // Debugging
//             if (currentTaskId) {
//                 modal.style.display = 'block';
//                 loadChatHistory(currentTaskId)
//                     .then(() => getUserFish().then((fish) => {
//                         userFish.textContent = fish || '#123524';
//                     }));
//                 const activeRow = taskList.querySelector(`tr[data-id="${currentTaskId}"]`);
//                 if (activeRow) activeRow.classList.add('active');
//                 else console.error('Active row topilmadi:', currentTaskId);
//             }
//         });
//     } else {
//         console.error('task-list elementi topilmadi! HTML da "id=\"task-list\"" tekshirilsin.');
//     }

//     // Modalni yopish
//     if (closeModalBtn) {
//         closeModalBtn.addEventListener('click', () => {
//             modal.style.display = 'none';
//             document.querySelector('.task.active')?.classList.remove('active');
//             currentTaskId = null; // Modal yopilganda taskId ni tozalash
//         });
//     } else {
//         console.error('close-modal elementi topilmadi!');
//     }

//     // Modalni modaldan tashqari yopish (overlay)
//     window.addEventListener('click', (event) => {
//         if (event.target === modal) {
//             modal.style.display = 'none';
//             document.querySelector('.task.active')?.classList.remove('active');
//             currentTaskId = null; // Modal yopilganda taskId ni tozalash
//         }
//     });

//     // Esc tugmasi bilan yopish
//     document.addEventListener('keydown', (event) => {
//         if (event.key === 'Escape' && modal.style.display === 'block') {
//             modal.style.display = 'none';
//             document.querySelector('.task.active')?.classList.remove('active');
//             currentTaskId = null; // Modal yopilganda taskId ni tozalash
//         }
//     });

//     // Chat tarixini yuklash va joylashuvni aniqlash
//     function loadChatHistory(taskId) {
//         fetch(`${serverUrl}/api/chat-history/${taskId}`)
//             .then((response) => {
//                 if (!response.ok) throw new Error('Server xatosi: ' + response.status);
//                 return response.json();
//             })
//             .then((data) => {
//                 console.log('Chat tarixi (xom ma’lumot):', data); // Debugging
//                 chatHistory.innerHTML = data.length > 0
//                     ? data
//                           .map((message) => {
//                               const isCurrentUser = String(message.user_task_id) === currentUserId; // String sifatida solishtirish
//                               console.log('Tekshirish:', {
//                                   messageUserId: message.user_task_id,
//                                   currentUserId,
//                                   isCurrentUser,
//                                   rawMessage: message,
//                               }); // Debugging
//                               return `
//                                   <div class="chat-message ${isCurrentUser ? 'right' : 'left'}">
//                                       <p><strong>${message.fish || 'Noma\'lum'}</strong>: ${message.matn || ''} <small>(${formatDateTime(message.vaqt)})</small></p>
//                                       ${
//                                           message.file_paths
//                                               ? '<br>Fayllar: ' + 
//                                                 JSON.parse(message.file_paths)
//                                                     .map((filePath) => {
//                                                         const fileName = filePath.split('/').pop();
//                                                         const fullUrl = `${serverUrl}${filePath}`;
//                                                         console.log('To\'liq fayl URL:', fullUrl, 'Fayl nomi:', fileName); // Debugging
//                                                         return `<a href="${fullUrl}" download="${fileName}">${fileName}</a>`;
//                                                     })
//                                                     .join(', ')
//                                               : ''
//                                       }
//                                   </div>
//                               `;
//                           })
//                           .join('')
//                     : '<p>Chat tarixi mavjud emas.</p>';
//             })
//             .catch((error) => {
//                 console.error('Tarixni yuklashda xatolik:', error);
//                 chatHistory.innerHTML = '<p>Tarix yuklanmadi: ' + error.message + '</p>';
//             });
//     }

//     // Xabar yuborish va bazada saqlash
//     window.sendMessage = function () {
//         console.log('Yuborish boshlandi, currentTaskId:', currentTaskId); // Debugging
//         const taskId = currentTaskId; // Global o'zgaruvchidan olish
//         const userId = sessionStorage.getItem('userId') || null;
//         console.log('Yuborish uchun task_id:', taskId, 'user_task_id:', userId); // Debugging
//         const text = messageInput.value.trim();
//         const files = fileUpload.files;

//         if (!taskId) {
//             alert('Iltimos, biror vazifani tanlang!');
//             return;
//         }

//         if (!userId) {
//             alert('Foydalanuvchi ID si topilmadi!');
//             return;
//         }

//         if (!text && files.length === 0) {
//             alert('Iltimos, matn yoki fayl yuklang!');
//             return;
//         }

//         getUserFish().then((fish) => {
//             const formData = new FormData();
//             formData.append('task_id', taskId); // Jadvaldagi task_id
//             formData.append('user_task_id', userId); // Jadvaldagi user_task_id
//             formData.append('fish', fish);
//             formData.append('matn', text);
//             const originalFileNames = [];
//             for (let file of files) {
//                 formData.append('files', file);
//                 originalFileNames.push(file.name); // Original fayl nomlarini saqlash
//             }
//             formData.append('original_file_names', JSON.stringify(originalFileNames)); // Original nomlarni yuborish

//             // So'rovni tekshirish uchun log
//             for (let [key, value] of formData.entries()) {
//                 console.log('FormData:', key + ': ' + (value instanceof File ? value.name : value));
//             }

//             fetch(`${serverUrl}/api/send-message`, {
//                 method: 'POST',
//                 body: formData,
//             })
//                 .then((response) => {
//                     if (!response.ok) {
//                         console.error('Server javobi:', response.status, response.statusText);
//                         return response.text().then((text) => {
//                             console.error('Server xato matni:', text); // Qo'shimcha xatolarni ko'rsatish
//                             throw new Error('Yuborishda xatolik: ' + response.status + ' - ' + text);
//                         });
//                     }
//                     return response.json();
//                 })
//                 .then((data) => {
//                     console.log('Yuborish natijasi:', data); // Debugging
//                     alert(data.message);
//                     loadChatHistory(taskId); // Yangilangan tarixni modalda ko‘rsatish
//                     messageInput.value = '';
//                     fileUpload.value = '';
//                 })
//                 .catch((error) => {
//                     console.error('Xabar yuborishda xatolik:', error);
//                     alert('Xabar yuborishda xatolik: ' + error.message);
//                 });
//         });
//     };

//     // Modalni yopish funksiyasi (onclick uchun)
//     window.closeModal = function () {
//         if (closeModalBtn) {
//             closeModalBtn.click();
//         } else {
//             console.error('close-modal elementi topilmadi!');
//             modal.style.display = 'none';
//             document.querySelector('.task.active')?.classList.remove('active');
//             currentTaskId = null; // Modal yopilganda taskId ni tozalash
//         }
//     };
// });













document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('task-list');
    const modal = document.getElementById('task-modal-tarix');
    const chatHistory = document.getElementById('chat-history');
    const messageInput = document.getElementById('message-input');
    const fileUpload = document.getElementById('file-upload');
    const userFish = document.getElementById('user-fish');
    const closeModalBtn = document.querySelector('.close-modal');
    const sendButton = document.querySelector('button[onclick="sendMessage()"]');
    const taskNameDisplay = document.getElementById('task-name-display');
    const taskIdDisplay = document.getElementById('task-id-display');
    const taskDescription = document.getElementById('task-description');
    const resultsSection = document.getElementById('results-section');
    const taskDetailsRight = document.getElementById('task-details-right');

    let currentTaskId = null;
    const currentUserId = sessionStorage.getItem('userId') || '#123524';
    const serverUrl = 'http://localhost:5000';

    // Elementlarni mavjudligini tekshirish
    console.log('Elementlar tekshiruvi:', {
        taskList: !!taskList,
        modal: !!modal,
        chatHistory: !!chatHistory,
        messageInput: !!messageInput,
        fileUpload: !!fileUpload,
        userFish: !!userFish,
        closeModalBtn: !!closeModalBtn,
        sendButton: !!sendButton,
        taskNameDisplay: !!taskNameDisplay,
        taskIdDisplay: !!taskIdDisplay,
        taskDescription: !!taskDescription,
        resultsSection: !!resultsSection,
        taskDetailsRight: !!taskDetailsRight
    });

    function formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    function calculateDaysDiff(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    function getUserFish() {
        return Promise.resolve(currentUserId);
    }

    async function updateUnreadCount() {
        if (!taskList) {
            console.error('taskList elementi topilmadi!');
            return;
        }
        const rows = taskList.getElementsByTagName('tr');
        for (let row of rows) {
            const taskId = row.getAttribute('data-id');
            if (taskId) {
                try {
                    const response = await fetch(`${serverUrl}/api/chat-history/${taskId}`);
                    if (!response.ok) throw new Error('Server xatosi');
                    const data = await response.json();
                    console.log(`Task ${taskId} uchun barcha xabarlar ma'lumotlari:`, data);
                    const unreadCount = data.filter(msg => (msg.is_read === 0 || msg.is_read === false) && String(msg.user_task_id) !== currentUserId).length;
                    console.log(`Task ${taskId} uchun o'qilmagan xabarlar soni: ${unreadCount}`);
                    const taskNameCell = row.querySelector('td:nth-child(2)');
                    if (taskNameCell) {
                        const countSpan = taskNameCell.querySelector(`.unread-count[data-task-id="${taskId}"]`) || document.createElement('span');
                        if (!countSpan.parentElement) {
                            countSpan.className = 'unread-count';
                            countSpan.setAttribute('data-task-id', taskId);
                            taskNameCell.insertBefore(countSpan, countSpan.firstChild);
                        }
                        countSpan.textContent = unreadCount > 0 ? `(${unreadCount}) ` : '';
                        countSpan.style.color = 'red';
                        countSpan.style.fontWeight = 'bold';
                    } else {
                        console.error(`Task ${taskId} uchun vazifa nomi elementi topilmadi`);
                    }
                } catch (error) {
                    console.error(`Chat tarixi yuklashda xatolik (${taskId}):`, error);
                }
            } else {
                console.warn('Row da data-id atributi topilmadi:', row);
            }
        }
    }

    if (taskList) {
        taskList.addEventListener('modalOpen', (e) => {
            currentTaskId = e.taskId;
            console.log('Modal ochildi, currentTaskId:', currentTaskId, 'taskList:', taskList);
            if (currentTaskId && modal) {
                modal.classList.remove('modal-close');
                modal.classList.add('modal-open');
                setTimeout(() => {
                    modal.style.display = 'block';
                    loadTaskDetails(currentTaskId)
                        .then(() => getUserFish().then((fish) => {
                            if (userFish) userFish.textContent = fish || '#123524';
                            else console.warn('userFish elementi topilmadi, default qiymat o‘rnini bosadi:', currentUserId);
                        }))
                        .then(() => markMessagesAsRead(currentTaskId))
                        .then(() => updateUnreadCount())
                        .catch(err => console.error('Yuklash jarayonida xatolik:', err));
                }, 10);
                const activeRow = taskList.querySelector(`tr[data-id="${currentTaskId}"]`);
                if (activeRow) activeRow.classList.add('active');
                else console.error('Active row topilmadi:', currentTaskId);
            } else {
                console.error('currentTaskId yoki modal elementi mavjud emas:', { currentTaskId, modal });
            }
        });
    } else {
        console.error('taskList elementi topilmadi! HTML da "id=\"task-list\"" tekshirilsin.');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.remove('modal-open');
                modal.classList.add('modal-close');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.querySelector('.task.active')?.classList.remove('active');
                    currentTaskId = null;
                    updateUnreadCount();
                }, 300);
            } else {
                console.error('closeModalBtn ishlamaydi, modal elementi topilmadi!');
            }
        });
    } else {
        console.error('closeModalBtn elementi topilmadi!');
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            if (modal) {
                modal.classList.remove('modal-open');
                modal.classList.add('modal-close');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.querySelector('.task.active')?.classList.remove('active');
                    currentTaskId = null;
                    updateUnreadCount();
                }, 300);
            } else {
                console.error('Modal elementi topilmadi, click hodisasi ishlamaydi!');
            }
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal && modal.style.display === 'block') {
            modal.classList.remove('modal-open');
            modal.classList.add('modal-close');
            setTimeout(() => {
                modal.style.display = 'none';
                document.querySelector('.task.active')?.classList.remove('active');
                currentTaskId = null;
                updateUnreadCount();
            }, 300);
        } else if (!modal) {
            console.error('Escape tugmasi ishlamaydi, modal elementi topilmadi!');
        }
    });

    async function loadTaskDetails(taskId) {
        try {
            const response = await fetch(`${serverUrl}/api/task-details/${taskId}`);
            if (!response.ok) throw new Error('Vazifa detallarini yuklashda xatolik');
            const task = await response.json();
            if (taskNameDisplay) taskNameDisplay.textContent = task.vazifa_nomi || 'Noma\'lum vazifa';
            else console.error('taskNameDisplay elementi topilmadi!');
            if (taskIdDisplay) taskIdDisplay.textContent = `Vazifa raqami: ${task.id || taskId}`;
            else console.error('taskIdDisplay elementi topilmadi!');
            if (taskDescription) taskDescription.textContent = task.izoh || 'Izoh mavjud emas';
            else console.error('taskDescription elementi topilmadi!');
            loadTaskDetailsRight(taskId);
            updateResultsSection(taskId);
        } catch (error) {
            console.error('Vazifa detallarini yuklashda xatolik:', error);
            if (taskNameDisplay) taskNameDisplay.textContent = 'Vazifa nomi yuklanmadi';
            if (taskIdDisplay) taskIdDisplay.textContent = `Vazifa raqami: ${taskId}`;
            if (taskDescription) taskDescription.textContent = 'Izoh yuklanmadi';
        }
    }

    async function loadTaskDetailsRight(taskId) {
        try {
            const response = await fetch(`${serverUrl}/api/task-details-right/${taskId}`);
            if (!response.ok) throw new Error('O‘ng tomon detallarini yuklashda xatolik');
            const details = await response.json();
            const daysDiff = calculateDaysDiff(details.vazifa_boshlanish_sanasi, details.vazifa_tugash_sanasi);
            if (taskDetailsRight) taskDetailsRight.innerHTML = `
                <p><strong>Masul hodim:</strong> ${details.vazifa_masul_hodimi || 'Noma\'lum'}</p>
                <p><strong>Boshlanish sanasi:</strong> ${formatDateTime(details.vazifa_boshlanish_sanasi) || 'Noma\'lum'}</p>
                <p><strong>Tugash sanasi:</strong> ${formatDateTime(details.vazifa_tugash_sanasi) || 'Noma\'lum'}</p>
                <p><strong>Kunlar farqi:</strong> ${daysDiff || '0'} kun</p>
                <p><strong>Kim qo‘ygan:</strong> ${details.project_id ? `Loyiha ${details.project_id}` : 'Noma\'lum'}</p>
            `;
            else console.error('taskDetailsRight elementi topilmadi!');
        } catch (error) {
            console.error('O‘ng tomon detallarini yuklashda xatolik:', error);
            if (taskDetailsRight) taskDetailsRight.innerHTML = '<p>Ma\'lumotlar yuklanmadi.</p>';
        }
    }

    async function updateResultsSection(taskId) {
        try {
            const response = await fetch(`${serverUrl}/api/chat-history/${taskId}`);
            if (!response.ok) throw new Error('Natijalarni yuklashda xatolik');
            const data = await response.json();
            const latestResult = data.length > 0 ? data[0] : null;
            if (resultsSection) resultsSection.innerHTML = latestResult
                ? `
                    <div class="result-item">
                        <p><strong>Natija:</strong> ${latestResult.matn || 'Hech narsa yozilmagan'}</p>
                        ${
                            latestResult.file_paths && latestResult.original_file_names
                                ? '<p><strong>Fayllar:</strong> ' + JSON.parse(latestResult.file_paths)
                                    .map((filePath, index) => {
                                        const storedFileName = filePath.split('/').pop();
                                        const originalFileName = JSON.parse(latestResult.original_file_names)[index] || storedFileName;
                                        const fullUrl = `${serverUrl}${filePath}`;
                                        return `<a href="${fullUrl}" download="${storedFileName}">${originalFileName}</a>`;
                                    })
                                    .join(', ') + '</p>'
                                : latestResult.file_paths
                                ? '<p><strong>Fayllar:</strong> Yuklanmadi</p>'
                                : ''
                        }
                        <label><input type="checkbox" ${latestResult.isRead ? 'checked' : ''} disabled> Tasdiqlandi</label>
                    </div>
                `
                : '<p>Natija mavjud emas.</p>';
            else console.error('resultsSection elementi topilmadi!');
        } catch (error) {
            console.error('Natijalarni yuklashda xatolik:', error);
            if (resultsSection) resultsSection.innerHTML = '<p>Natijalar yuklanmadi.</p>';
        }
    }

    function loadChatHistory(taskId) {
        fetch(`${serverUrl}/api/chat-history/${taskId}`)
            .then((response) => {
                if (!response.ok) throw new Error('Server xatosi: ' + response.status);
                return response.json();
            })
            .then((data) => {
                console.log('Chat tarixi (xom ma’lumot):', data);
                if (chatHistory) chatHistory.innerHTML = data.length > 0
                    ? data
                          .map((message) => {
                              const isCurrentUser = String(message.user_task_id) === currentUserId;
                              console.log('Tekshirish:', {
                                  messageUserId: message.user_task_id,
                                  currentUserId,
                                  isCurrentUser,
                                  rawMessage: message,
                                  isRead: message.is_read,
                              });
                              return `
                                  <div class="chat-message ${isCurrentUser ? 'right' : 'left'}">
                                      <p><strong>${message.fish || 'Noma\'lum'}</strong>: ${message.matn || ''} <small>(${formatDateTime(message.vaqt)})</small></p>
                                      ${
                                          message.file_paths && message.original_file_names
                                              ? '<br>Fayllar: ' + 
                                                JSON.parse(message.file_paths)
                                                    .map((filePath, index) => {
                                                        const storedFileName = filePath.split('/').pop();
                                                        const originalFileName = JSON.parse(message.original_file_names)[index] || storedFileName;
                                                        const fullUrl = `${serverUrl}${filePath}`;
                                                        return `<a href="${fullUrl}" download="${storedFileName}">${originalFileName}</a>`;
                                                    })
                                                    .join(', ')
                                              : message.file_paths
                                              ? '<br>Fayllar: Yuklanmadi'
                                              : ''
                                      }
                                  </div>
                              `;
                          })
                          .join('')
                    : '<p>Chat tarixi mavjud emas.</p>';
                else console.error('chatHistory elementi topilmadi!');
            })
            .catch((error) => {
                console.error('Tarixni yuklashda xatolik:', error);
                if (chatHistory) chatHistory.innerHTML = '<p>Tarix yuklanmadi: ' + error.message + '</p>';
            });
    }

    async function markMessagesAsRead(taskId) {
        try {
            const response = await fetch(`${serverUrl}/api/mark-read/${taskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_task_id: currentUserId })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Xabarlarni o\'qilgan deb belgilashda xatolik: ' + errorText);
            }
            const result = await response.json();
            console.log('Xabarlarni o\'qilgan deb belgilash natijasi:', result);
            if (result.affectedRows > 0) {
                console.log(`${result.affectedRows} ta xabar o\'qilgan deb belgilandi`);
                await updateUnreadCount();
            } else {
                console.log('O\'qilmagan xabar topilmadi yoki barchasi allaqachon o\'qilgan');
                await updateUnreadCount();
            }
        } catch (error) {
            console.error('Xabarlarni o\'qilgan deb belgilashda xatolik:', error);
        }
    }

    window.sendMessage = function () {
        console.log('Yuborish boshlandi, currentTaskId:', currentTaskId);
        const taskId = currentTaskId;
        const userId = sessionStorage.getItem('userId') || null;
        console.log('Yuborish uchun task_id:', taskId, 'user_task_id:', userId);
        const text = messageInput.value.trim();
        const files = fileUpload.files;

        if (!taskId) {
            alert('Iltimos, biror vazifani tanlang!');
            return;
        }

        if (!userId) {
            alert('Foydalanuvchi ID si topilmadi!');
            return;
        }

        if (!text && files.length === 0) {
            alert('Iltimos, matn yoki fayl yuklang!');
            return;
        }

        getUserFish().then((fish) => {
            const formData = new FormData();
            formData.append('task_id', taskId);
            formData.append('user_task_id', userId);
            formData.append('fish', fish);
            formData.append('matn', text);
            const originalFileNames = [];
            for (let file of files) {
                formData.append('files', file);
                originalFileNames.push(file.name);
            }
            formData.append('original_file_names', JSON.stringify(originalFileNames));

            for (let [key, value] of formData.entries()) {
                console.log('FormData:', key + ': ' + (value instanceof File ? value.name : value));
            }

            fetch(`${serverUrl}/api/send-message`, {
                method: 'POST',
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        console.error('Server javobi:', response.status, response.statusText);
                        return response.text().then((text) => {
                            console.error('Server xato matni:', text);
                            throw new Error('Yuborishda xatolik: ' + response.status + ' - ' + text);
                        });
                    }
                    return response.json();
                })
                .then((data) => {
                    console.log('Yuborish natijasi:', data);
                    alert(data.message);
                    loadChatHistory(taskId);
                    updateResultsSection(taskId);
                    updateUnreadCount();
                    messageInput.value = '';
                    fileUpload.value = '';
                })
                .catch((error) => {
                    console.error('Xabar yuborishda xatolik:', error);
                    alert('Xabar yuborishda xatolik: ' + error.message);
                });
        });
    };

    window.closeModal = function () {
        if (closeModalBtn) {
            closeModalBtn.click();
        } else {
            console.error('close-modal elementi topilmadi!');
            if (modal) {
                modal.classList.remove('modal-open');
                modal.classList.add('modal-close');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.querySelector('.task.active')?.classList.remove('active');
                    currentTaskId = null;
                    updateUnreadCount();
                }, 300);
            } else {
                console.error('Modal elementi topilmadi!');
            }
        }
    };

    updateUnreadCount();
    setInterval(updateUnreadCount, 10000);
});