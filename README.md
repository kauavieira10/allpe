# Dashboard de Performance — All Pé

Dashboard de marketing digital em **glassmorphism estilo Apple/iOS**, com integração ao **Google Sheets** (e, opcionalmente, **Meta Ads**). HTML/CSS/JS puro no frontend + um proxy Node leve no backend que mantém suas chaves protegidas.

## ✨ O que tem
- Tema claro/escuro persistente, blobs animados, cards de vidro
- KPIs (orçamento, leads, CPL), gráfico de leads acumulados, doughnut de verba e tendência de CPL
- Cards por plataforma (Google × Facebook), tabela diária com cabeçalho fixo
- Seletor de período com atalhos + calendário em popup
- Aba de criativos (dados demo; vira real ao configurar o Meta)
- **Fallback automático**: se a planilha não responder, mostra 30 dias de dados demo e marca o selo como “Demo”

## 🗂 Estrutura
```
index.html                 frontend completo (CSS + JS inline)
server.js                  proxy Node (Render) + serve estáticos
netlify/functions/         proxies para Netlify
  ├ sheets-proxy.js
  └ meta-creatives-proxy.js
assets/                    logos (acesso branca + All Pé)
data/dataset.js            fallback offline de referência
.env / .env.example        variáveis (NÃO versionar o .env real)
render.yaml · netlify.toml configs de deploy
```

## ▶️ Rodar localmente
Pré-requisito: Node 18+.
```bash
# 1. preencha o .env (já vem com suas variáveis)
# 2. suba o servidor
node server.js
# abra http://localhost:3000
```
> Abrir o `index.html` direto (file://) também funciona, mas aí **sem** dados reais — ele cai no modo demo, porque a planilha só é lida pelo proxy.

## 🔌 Como a planilha é lida
O frontend chama `GET /api/sheets`. O proxy busca na Google Sheets API usando suas variáveis e devolve `{ values: [...] }`. O frontend então **detecta as colunas pelo cabeçalho** (acentos/maiúsculas ignorados), procurando por:

| Campo | Procura no cabeçalho por |
|---|---|
| Data | `data` |
| Dia da semana | `dia` |
| Verba Google | `verba/invest/custo` + `google` |
| Leads Google | `lead` + `google` |
| CPL Google | `cpl` + `google` |
| Verba Facebook | `verba/invest` + `face/meta` |
| Leads Facebook | `lead` + `face/meta` |
| CPL Facebook | `cpl` + `face/meta` |

Se o CPL não existir na planilha, ele é calculado (verba ÷ leads). Se algum nome de coluna for diferente, abra `index.html`, procure por `// SHEETS.JS` e ajuste as palavras em `col(headers, ...)`.

## 🔐 Segurança
- A API Key fica **só no servidor** (variável de ambiente), nunca no HTML.
- Restrinja a chave no Google Cloud Console: **APIs e Serviços → Credenciais → sua chave → Restrições de API → Google Sheets API**. Se for chamada de domínio fixo, adicione também restrição de referenciador.
- A planilha precisa estar **pública para leitura** (Compartilhar → “Qualquer pessoa com o link” → Leitor) para a API Key funcionar.

Deploy passo a passo: veja **DEPLOY-RENDER.md**.
