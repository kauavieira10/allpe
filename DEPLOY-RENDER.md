# Deploy no Render — passo a passo

Tempo estimado: ~5 minutos.

## 1. Suba o código no GitHub
```bash
cd dashboard-allpe
git init
git add .
git commit -m "dashboard all pé"
# crie um repo vazio no GitHub e:
git remote add origin https://github.com/SEU_USUARIO/dashboard-allpe.git
git push -u origin main
```
> O `.gitignore` já impede o `.env` e o `node_modules` de irem para o repositório. As chaves vão direto no painel do Render (passo 4).

## 2. Deixe a planilha legível
No Google Sheets: **Compartilhar → Acesso geral → “Qualquer pessoa com o link” → Leitor**. Sem isso a API Key não consegue ler.

## 3. Crie o serviço no Render
1. Acesse [dashboard.render.com](https://dashboard.render.com) → **New → Web Service**
2. Conecte o repositório do GitHub
3. Configure:
   - **Runtime:** Node
   - **Build Command:** *(deixe vazio)*
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

## 4. Configure as variáveis de ambiente
Em **Environment → Add Environment Variable**, adicione:

| Key | Value |
|---|---|
| `GOOGLE_SHEETS_API_KEY` | sua API Key |
| `GOOGLE_SHEETS_ID` | `1oQjuFPA5QPtnE-_uQNQQinJV6cKjJoANuni5OBbnp00` |
| `GOOGLE_SHEETS_NAME` | `Diário Performance` |
| `GOOGLE_SHEETS_RANGE` | `A1:Z200` |
| `META_ACCESS_TOKEN` | *(opcional — só p/ criativos)* |
| `META_AD_ACCOUNT_ID` | *(opcional — `act_XXXX`)* |

## 5. Deploy
Clique em **Create Web Service**. Em ~2 min o Render dá uma URL tipo
`https://dashboard-allpe.onrender.com`. Abra — o selo deve mostrar **Online**.

## ✅ Como verificar
- Abra `SUA_URL/api/sheets` no navegador → deve retornar um JSON com `values`.
- No console do dashboard (F12) procure: `[Sheets] ✓ N linhas carregadas da planilha`.
- Se aparecer **Demo** no selo: confira se a planilha está pública e se o nome da aba bate exatamente com `GOOGLE_SHEETS_NAME` (incluindo o acento em “Diário”).

## Alternativa: Netlify
O projeto já vem com `netlify.toml` e as functions. No Netlify: **Add new site → Import**, defina as mesmas variáveis em **Site settings → Environment variables**. Os redirects de `/api/*` já estão configurados.

## Erros comuns
| Sintoma | Causa / correção |
|---|---|
| Selo fica em **Demo** | Planilha não está pública, ou nome da aba/range errado |
| `/api/sheets` retorna `error` | API Key sem permissão para a Sheets API, ou chave restrita demais |
| Colunas zeradas | Cabeçalho com nomes diferentes — ajuste em `index.html` (bloco `// SHEETS.JS`) |
| “quota exceeded” | Cache de 5 min já reduz chamadas; gere outra chave se persistir |
