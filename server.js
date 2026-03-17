const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Banco de Dados PostgreSQL (Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Rotas HTML
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
app.post('/api/candidatos', async (req, res) => {
    try {
        const d = req.body;
        const query = `
            INSERT INTO candidatos (
                nome_completo, idade, forma_recrutamento, indicacao_de, cargo_pretendido, 
                tem_transporte, reside_em, naturalidade, estado_civil, quantidade_filhos, 
                escolaridade, idiomas, informatica, experiencia_fora_pais, quais_paises, 
                primeiro_emprego, experiencias, motivacao, dificuldade_interpessoal, 
                habilidades_competencias, pretensao_salarial
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING id
        `;
        
        const values = [
            d.nome_completo, d.idade, d.forma_recrutamento, d.indicacao_de, d.cargo_pretendido,
            d.tem_transporte, d.reside_em, d.naturalidade, d.estado_civil, d.quantidade_filhos,
            JSON.stringify(d.escolaridade), JSON.stringify(d.idiomas), d.informatica, d.experiencia_fora_pais, d.quais_paises,
            d.primeiro_emprego, JSON.stringify(d.experiencias), d.motivacao, d.dificuldade_interpessoal,
            d.habilidades_competencias, d.pretensao_salarial
        ];

        const result = await pool.query(query, values);
        res.json({ message: 'Sucesso!', id: result.rows[0].id });
    } catch (err) {
        console.error(err);
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
app.get('/api/candidatos', checkAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidatos ORDER BY data_envio DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Atualizar Status
app.put('/api/candidatos/:id', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE candidatos SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: 'OK' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Apagar Candidato
app.delete('/api/candidatos/:id', checkAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM candidatos WHERE id = $1', [id]);
        res.json({ message: 'OK' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));

module.exports = app;