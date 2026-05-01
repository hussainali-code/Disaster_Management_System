// hashPasswords.js
// Run this ONCE to generate bcrypt hashes for your seed users
// Command: node hashPasswords.js

const bcrypt = require('bcryptjs');

const users = [
    { username: 'admin_sara',   password: 'Admin@123' },
    { username: 'op_khalid',    password: 'Operator@123' },
    { username: 'field_ali',    password: 'Field@123' },
    { username: 'wm_fatima',    password: 'Warehouse@123' },
    { username: 'finance_omar', password: 'Finance@123' },
];

async function generateHashes() {
    console.log('\n--- Copy these UPDATE statements into SSMS and run them ---\n');
    for (const user of users) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`UPDATE Users SET password_hash = '${hash}' WHERE username = '${user.username}';`);
    }
    console.log('\n--- Done ---\n');
}

generateHashes();
