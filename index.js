const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); // <-- [BARU] Modul Session

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

// ================= PENGATURAN SESSION =================
// [BARU] Memberikan "tiket" untuk mengingat bahwa admin sudah login
app.use(session({
    secret: 'kunci-rahasia-hrd', // Password rahasia untuk enkripsi tiket session
    resave: false,
    saveUninitialized: false
}));

// [BARU] Fungsi "Satpam" untuk mengecek apakah user sudah login
const cekLogin = (req, res, next) => {
    if (req.session.loggedIn) {
        next(); // Jika sudah login, persilakan masuk ke halaman tujuan
    } else {
        res.redirect('/login'); // Jika belum, tendang ke halaman login
    }
};

// ================= KONEKSI DATABASE =================
const db = mysql.createPool({
    host: 'mysql-ef0ec28-masalampau544-2dcf.g.aivencloud.com',
    port: 24813,
    user: 'avnadmin',
    password: 'AVNS_lFWmvB1qZ5mqxmRJVy7', 
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false 
    }
});

// Buat tabel karyawan (otomatis)
const buatTabel = `CREATE TABLE IF NOT EXISTS karyawan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(50) NOT NULL,
    departemen VARCHAR(50) NOT NULL,
    gaji INT NOT NULL
)`;

db.query(buatTabel, (err, result) => {
    if (err) console.error("Gagal buat tabel:", err);
    else console.log('Tabel karyawan siap!');
});

// ================= ROUTING OTENTIKASI (LOGIN & LOGOUT) =================

// Menampilkan halaman Login
app.get('/login', (req, res) => {
    // Kalau ternyata dia sudah login, langsung lempar ke Dashboard (jangan suruh login lagi)
    if (req.session.loggedIn) return res.redirect('/');
    res.render('login', { error: null }); 
});

// Proses pengecekan Username & Password ke Database
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Cek ke tabel 'admin' yang tadi kita buat di DBeaver
    db.query('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.render('login', { error: 'Terjadi kesalahan sistem database' });
        }

        if (results.length > 0) {
            // Jika data ditemukan (username & password cocok)
            req.session.loggedIn = true;     // Beri status login
            req.session.username = username; // Simpan nama usernamenya
            res.redirect('/');               // Lempar ke halaman utama (Dashboard)
        } else {
            // Jika tidak cocok (gagal)
            res.render('login', { error: 'Username atau Password salah!' });
        }
    });
});

// Proses Logout (Keluar)
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/login'); // Hapus tiket session, lalu kembalikan ke login
    });
});

// ================= ROUTING CRUD (DILINDUNGI SANG SATPAM) =================

// 1. READ (Tambahkan 'cekLogin' di tengah parameter)
app.get('/', cekLogin, (req, res) => {
    db.query('SELECT * FROM karyawan', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Sedang menyiapkan database, coba refresh...');
        }
        res.render('index', { karyawan: results });
    });
});

// 2. CREATE 
app.get('/tambah', cekLogin, (req, res) => {
    res.render('tambah');
});

app.post('/tambah', cekLogin, (req, res) => {
    const { nama, jabatan, departemen, gaji } = req.body;
    db.query('INSERT INTO karyawan (nama, jabatan, departemen, gaji) VALUES (?, ?, ?, ?)', 
    [nama, jabatan, departemen, gaji], (err, results) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// 3. UPDATE 
app.get('/edit/:id', cekLogin, (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) console.error(err);
        res.render('edit', { data: results[0] });
    });
});

app.post('/edit/:id', cekLogin, (req, res) => {
    const id = req.params.id;
    const { nama, jabatan, departemen, gaji } = req.body;
    db.query('UPDATE karyawan SET nama=?, jabatan=?, departemen=?, gaji=? WHERE id=?', 
    [nama, jabatan, departemen, gaji, id], (err, results) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// 4. DELETE 
app.get('/hapus/:id', cekLogin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// ================= JALANKAN SERVER =================
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});

// WAJIB UNTUK VERCEL
module.exports = app;