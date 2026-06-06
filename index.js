const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

// Koneksi ke Database db_perusahaan
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'db_perusahaan'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Database Perusahaan terhubung...');
});

// ================= ROUTING CRUD =================

// 1. READ: Menampilkan semua data karyawan
app.get('/', (req, res) => {
    db.query('SELECT * FROM karyawan', (err, results) => {
        if (err) throw err;
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
        if (err) throw err;
        res.redirect('/');
    });
});

// 3. UPDATE: Menampilkan form edit & menyimpan perubahan
app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.render('edit', { data: results[0] });
    });
});

app.post('/edit/:id', (req, res) => {
    const id = req.params.id;
    const { nama, jabatan, departemen, gaji } = req.body;
    db.query('UPDATE karyawan SET nama=?, jabatan=?, departemen=?, gaji=? WHERE id=?', 
    [nama, jabatan, departemen, gaji, id], (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// 4. DELETE: Menghapus data karyawan
app.get('/hapus/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM karyawan WHERE id = ?', [id], (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});

// Jalankan Server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});