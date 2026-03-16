# Sistema de Recrutamento Bramarlog - Guia de Hospedagem

Este projeto está configurado para funcionar tanto localmente (com SQLite) quanto na nuvem (com PostgreSQL).

## 🚀 Como Hospedar (Recomendado: Render.com)

1. **Suba o código para o GitHub** (Você já fez isso!).
2. **Crie um Banco de Dados Cloud:**
   - Acesse [Supabase.com](https://supabase.com) ou [Neon.tech](https://neon.tech).
   - Crie um novo projeto e copie a **Connection String (DATABASE_URL)**.
3. **Hospede o Backend no Render:**
   - Acesse [Render.com](https://render.com).
   - Clique em **New** > **Web Service**.
   - Conecte seu repositório `RHBRAMARLOG`.
   - **Configurações:**
     - Runtime: `Node`
     - Build Command: `npm install`
     - Start Command: `node server.js`
4. **Configure as Variáveis de Ambiente (Environment Variables):**
   - No Render, vá em **Environment**.
   - Adicione:
     - `DATABASE_URL`: (A URL que você copiou do Supabase/Neon).
     - `SESSION_SECRET`: `qualquer_texto_aleatorio`.

## 🛠️ Estrutura Atualizada
O projeto foi simplificado para que todos os arquivos HTML estejam na raiz, garantindo compatibilidade com diversas plataformas de hospedagem.

- `server.js`: Servidor inteligente (detecta se está local ou cloud).
- `index.html`: Página de recrutamento.
- `login.html`: Acesso ADM.
- `admin.html`: Painel de controle.

---
**Desenvolvido para Bramarlog**
