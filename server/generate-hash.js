const bcrypt = require('bcrypt');

bcrypt.hash('user123', 10, (err, hash) => {
    if (err) throw err;
    console.log('Hashed parol:', hash);
});