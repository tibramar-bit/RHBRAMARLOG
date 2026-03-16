require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Banco de Dados (Cloud ou Local)
let db;
const isProduction = process.env.DATABASE_URL;

if (isProduction) {
    // Usar PostgreSQL (Recomendado para Render/Railway/Supabase)
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Conectado ao banco de dados PostgreSQL (Cloud).');
    
    // Criar tabela no PostgreSQL se não existir
    db.query(`CREATE TABLE IF NOT EXISTS candidatos (
        id SERIAL PRIMARY KEY,
        nome_completo TEXT NOT NULL,
        idade INTEGER NOT NULL,
        forma_recrutamento TEXT,
        indicacao_de TEXT,
        cargo_pretendido TEXT NOT NULL,
        tem_transporte TEXT,
        reside_em TEXT,
        naturalidade TEXT NOT NULL,
        estado_civil TEXT NOT NULL,
        quantidade_filhos INTEGER NOT NULL,
        escolaridade TEXT,
        idiomas TEXT,
        informatica TEXT,
        experiencia_fora_pais TEXT,
        quais_paises TEXT,
        primeiro_emprego INTEGER DEFAULT 0,
        experiencias TEXT,
        motivacao TEXT NOT NULL,
        dificuldade_interpessoal TEXT NOT NULL,
        habilidades_competencias TEXT NOT NULL,
        pretensao_salarial TEXT NOT NULL,
        status TEXT DEFAULT 'Em Análise',
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
} else {
    // Usar SQLite local
    db = new sqlite3.Database('./database.db', (err) => {
        if (err) console.error('Erro ao abrir SQLite', err.message);
        else console.log('Conectado ao banco de dados SQLite (Local).');
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS candidatos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome_completo TEXT NOT NULL,
        idade INTEGER NOT NULL,
        forma_recrutamento TEXT,
        indicacao_de TEXT,
        cargo_pretendido TEXT NOT NULL,
        tem_transporte TEXT,
        reside_em TEXT,
        naturalidade TEXT NOT NULL,
        estado_civil TEXT NOT NULL,
        quantidade_filhos INTEGER NOT NULL,
        escolaridade TEXT,
        idiomas TEXT,
        informatica TEXT,
        experiencia_fora_pais TEXT,
        quais_paises TEXT,
        primeiro_emprego INTEGER DEFAULT 0,
        experiencias TEXT,
        motivacao TEXT NOT NULL,
        dificuldade_interpessoal TEXT NOT NULL,
        habilidades_competencias TEXT NOT NULL,
        pretensao_salarial TEXT NOT NULL,
        status TEXT DEFAULT 'Em Análise',
        data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Rotas HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'bramarlog-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// API de Cadastro
app.post('/api/candidatos', (req, res) => {
    const d = req.body;
    const sql = `INSERT INTO candidatos (
        nome_completo, idade, forma_recrutamento, indicacao_de, cargo_pretendido, 
        tem_transporte, reside_em, naturalidade, estado_civil, quantidade_filhos, 
        escolaridade, idiomas, informatica, experiencia_fora_pais, quais_paises, 
        primeiro_emprego, experiencias, motivacao, dificuldade_interpessoal, 
        habilidades_competencias, pretensao_salarial
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`;

    // Adaptar SQL para SQLite se necessário
    const finalSql = isProduction ? sql : sql.replace(/\$\d+/g, '?');
    
    const params = [
        d.nome_completo, d.idade, d.forma_recrutamento, d.indicacao_de, d.cargo_pretendido,
        d.tem_transporte, d.reside_em, d.naturalidade, d.estado_civil, d.quantidade_filhos,
        JSON.stringify(d.escolaridade), JSON.stringify(d.idiomas), d.informatica, d.experiencia_fora_pais, d.quais_paises,
        d.primeiro_emprego ? 1 : 0, JSON.stringify(d.experiencias), d.motivacao, d.dificuldade_interpessoal,
        d.habilidades_competencias, d.pretensao_salarial
    ];

    if (isProduction) {
        db.query(finalSql, params)
            .then(() => res.json({ message: 'Sucesso!' }))
            .catch(err => res.status(400).json({ error: err.message }));
    } else {
        db.run(finalSql, params, function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'Sucesso!', id: this.lastID });
        });
    }
});

// Login do ADM
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'adm' && senha === 'Bramarlog@hr@rec') {
        req.session.isLoggedIn = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Incorreto' });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) next();
    else res.status(401).json({ error: 'Não autorizado' });
};

// Listar Candidatos
app.get('/api/candidatos', checkAuth, (req, res) => {
    const sql = "SELECT * FROM candidatos ORDER BY data_envio DESC";
    if (isProduction) {
        db.query(sql).then(result => res.json(result.rows)).catch(err => res.status(400).json({ error: err.message }));
    } else {
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json(rows);
        });
    }
});

// Atualizar Status
app.put('/api/candidatos/:id', checkAuth, (req, res) => {
    const sql = `UPDATE candidatos SET status = ${isProduction ? '$1 WHERE id = $2' : '? WHERE id = ?'}`;
    const params = [req.body.status, req.params.id];
    
    if (isProduction) {
        db.query(sql, params).then(() => res.json({ message: 'OK' })).catch(err => res.status(400).json({ error: err.message }));
    } else {
        db.run(sql, params, (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'OK' });
        });
    }
});

// Apagar Candidato
app.delete('/api/candidatos/:id', checkAuth, (req, res) => {
    const sql = `DELETE FROM candidatos WHERE id = ${isProduction ? '$1' : '?'}`;
    if (isProduction) {
        db.query(sql, [req.params.id]).then(() => res.json({ message: 'OK' })).catch(err => res.status(400).json({ error: err.message }));
    } else {
        db.run(sql, req.params.id, (err) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: 'OK' });
        });
    }
});

app.listen(port, () => console.log(`Rodando em http://localhost:${port}`));
