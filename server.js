const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0';

// Banco de Dados JSON (Alternativa definitiva ao SQLite para o Render)
const DB_FILE = path.resolve(__dirname, 'database.json');

// Função para ler o banco
function getDb() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ candidatos: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

// Função para salvar no banco
function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Rota para a página inicial
app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.resolve(__dirname, 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.resolve(__dirname, 'admin.html')));

app.use(session({
    secret: 'bramarlog-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// API de Cadastro
app.post('/api/candidatos', (req, res) => {
    try {
        const d = req.body;
        const db = getDb();
        
        const novoCandidato = {
            id: Date.now(),
            ...d,
            status: 'Em Análise',
            data_envio: new Date().toISOString()
        };

        db.candidatos.push(novoCandidato);
        saveDb(db);
        
        res.json({ message: 'Sucesso!', id: novoCandidato.id });
    } catch (err) {
        res.status(400).json({ error: err.message });
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
    try {
        const db = getDb();
        res.json(db.candidatos.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio)));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Atualizar Status
app.put('/api/candidatos/:id', checkAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const db = getDb();
        
        const index = db.candidatos.findIndex(c => c.id == id);
        if (index !== -1) {
            db.candidatos[index].status = status;
            saveDb(db);
            res.json({ message: 'OK' });
        } else {
            res.status(404).json({ error: 'Não encontrado' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Apagar Candidato
app.delete('/api/candidatos/:id', checkAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        
        db.candidatos = db.candidatos.filter(c => c.id != id);
        saveDb(db);
        res.json({ message: 'OK' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(port, host, () => console.log(`Rodando em http://${host}:${port}`));
