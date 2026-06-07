const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path'); // Tambahan khusus agar Vercel mengenali folder views

const app = express();

// Beri tahu Vercel lokasi folder views yang benar
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

// Gunakan "createPool" dan "ssl" agar koneksi stabil di Vercel & Aiven
const db = mysql.createPool({
    host: 'mysql-ef0ec28-masalampau544-2dcf.g.aivencloud.com',
    port: 24813,
    user: 'avnadmin',
    password: 'AVNS_lFWmvB1qZ5mqxmRJVy7', // <-- GANTI DENGAN PASSWORD AIVEN!
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false // Wajib untuk database cloud Aiven
    }
});

// Buat tabel otomatis (menggunakan db.query dari pool)
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

// ================= ROUTING CRUD =================

// 1. READ: Menampilkan semua data karyawan
app.get('/', (req, res) => {
    db.query('SELECT * FROM karyawan', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Sedang menyiapkan database, coba refresh (F5) lagi...');
        }
        res.render('index', { karyawan: results });
    });
});

// 2. CREATE: Menampilkan form tambah & menyimpan data
app.get('/tambah', (req, res) => {
    res.render('tambah');
});

app.post('/tambah', (req, res) => {
    const { nama, jabatan, departemen, gaji } = req.body;
    db.query('INSERT INTO karyawan (nama, jabatan, departemen, gaji) VALUES (?, ?, ?, ?)', 
    [nama, jabatan, departemen, gaji], (err, results) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// 3. UPDATE: Menampilkan form edit & menyimpan perubahan
app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) console.error(err);
        res.render('edit', { data: results[0] });
    });
});

app.post('/edit/:id', (req, res) => {
    const id = req.params.id;
    const { nama, jabatan, departemen, gaji } = req.body;
    db.query('UPDATE karyawan SET nama=?, jabatan=?, departemen=?, gaji=? WHERE id=?', 
    [nama, jabatan, departemen, gaji, id], (err, results) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// 4. DELETE: Menghapus data karyawan
app.get('/hapus/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) console.error(err);
        res.redirect('/');
    });
});

// Jalankan Server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});

// WAJIB UNTUK VERCEL: Export aplikasi
module.exports = app;