const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do Banco de Dados
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
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
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'bramarlog-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Em produção, usar true com HTTPS
}));

// Rotas da API
app.post('/api/candidatos', (req, res) => {
    const data = req.body;
    const sql = `INSERT INTO candidatos (
        nome_completo, idade, forma_recrutamento, indicacao_de, cargo_pretendido, 
        tem_transporte, reside_em, naturalidade, estado_civil, quantidade_filhos, 
        escolaridade, idiomas, informatica, experiencia_fora_pais, quais_paises, 
        primeiro_emprego, experiencias, motivacao, dificuldade_interpessoal, 
        habilidades_competencias, pretensao_salarial
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        data.nome_completo, data.idade, data.forma_recrutamento, data.indicacao_de, data.cargo_pretendido,
        data.tem_transporte, data.reside_em, data.naturalidade, data.estado_civil, data.quantidade_filhos,
        JSON.stringify(data.escolaridade), JSON.stringify(data.idiomas), data.informatica, data.experiencia_fora_pais, data.quais_paises,
        data.primeiro_emprego ? 1 : 0, JSON.stringify(data.experiencias), data.motivacao, data.dificuldade_interpessoal,
        data.habilidades_competencias, data.pretensao_salarial
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Candidato cadastrado com sucesso!', id: this.lastID });
    });
});

// Login do ADM
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'adm' && senha === 'Bramarlog@hr@rec') {
        req.session.isLoggedIn = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha incorretos' });
    }
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Middleware de Proteção
const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
};

// Rotas ADM (Protegidas)
app.get('/api/candidatos', checkAuth, (req, res) => {
    db.all("SELECT * FROM candidatos ORDER BY data_envio DESC", [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/api/candidatos/:id', checkAuth, (req, res) => {
    const { status } = req.body;
    db.run("UPDATE candidatos SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Status atualizado' });
    });
});

app.delete('/api/candidatos/:id', checkAuth, (req, res) => {
    db.run("DELETE FROM candidatos WHERE id = ?", req.params.id, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'Candidato removido' });
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
