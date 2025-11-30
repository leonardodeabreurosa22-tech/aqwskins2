# 🚀 Guia de Deploy Completo - AQW Skins

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Deploy do Banco de Dados](#deploy-do-banco-de-dados)
3. [Deploy do Backend](#deploy-do-backend)
4. [Deploy do Frontend](#deploy-do-frontend)
5. [Configuração de DNS e SSL](#configuração-de-dns-e-ssl)
6. [Configuração de Pagamentos](#configuração-de-pagamentos)
7. [Monitoramento](#monitoramento)
8. [Backup e Recuperação](#backup-e-recuperação)

---

## Pré-requisitos

### Contas Necessárias
- ✅ GitHub (código-fonte)
- ✅ Neon (PostgreSQL)
- ✅ Render.com (backend)
- ✅ Vercel (frontend)
- ✅ Stripe (pagamentos)
- ✅ PayPal Developer (pagamentos)
- ✅ CloudFlare (CDN - opcional)

### Ferramentas Locais
```bash
node --version  # 18.x ou superior
npm --version   # 9.x ou superior
git --version   # Qualquer versão recente
psql --version  # Para testes locais (opcional)
```

---

## Deploy do Banco de Dados

### 1. Criar Projeto no Neon

1. Acesse https://neon.tech
2. Clique em "Sign Up" e faça login com GitHub
3. Crie um novo projeto:
   - Nome: `aqw-skins-db`
   - Região: Escolha mais próxima dos usuários
   - PostgreSQL Version: 15

4. Copie a Connection String:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 2. Executar Migrations

**Local:**
```bash
cd backend
npm install -g db-migrate
db-migrate up --config database.json
```

**Ou via psql:**
```bash
psql "postgresql://user:pass@host/db?sslmode=require" < database/schema.sql
```

### 3. Seed Inicial (Opcional)

Execute o script de seed para popular dados iniciais:
```bash
npm run db:seed
```

---

## Deploy do Backend

### 1. Preparar Repositório

**Criar .gitignore:**
```
node_modules/
.env
.env.local
.DS_Store
*.log
dist/
coverage/
```

**Commit e Push:**
```bash
git add .
git commit -m "Backend ready for deploy"
git push origin main
```

### 2. Deploy no Render.com

1. Acesse https://render.com
2. Conecte sua conta GitHub
3. Clique em "New +" → "Web Service"
4. Selecione o repositório `AQWSkins`

**Configurações:**
- **Name**: `aqw-skins-backend`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Starter ($7/mês) ou Free

### 3. Variáveis de Ambiente no Render

Vá em "Environment" e adicione:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://aqw-skins.vercel.app

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# JWT
JWT_SECRET=GERE_STRING_ALEATORIA_AQUI_64_CHARS
JWT_REFRESH_SECRET=GERE_OUTRA_STRING_ALEATORIA_64_CHARS
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLIC_KEY=pk_live_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=live

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-de-app-do-gmail

# Security
COOKIE_SECRET=GERE_STRING_ALEATORIA_32_CHARS
CSRF_SECRET=GERE_STRING_ALEATORIA_32_CHARS

# Optional
SENTRY_DSN=https://...
LOGrocket_APP_ID=...
```

**Gerar Strings Aleatórias:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy

Clique em "Create Web Service". Render irá:
1. Clonar o repositório
2. Executar `npm install`
3. Iniciar com `npm start`
4. Atribuir URL: `https://aqw-skins-backend.onrender.com`

### 5. Configurar Webhooks (Stripe)

1. Acesse Stripe Dashboard → Developers → Webhooks
2. Adicione endpoint:
   - URL: `https://aqw-skins-backend.onrender.com/api/v1/webhooks/stripe`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
3. Copie o `Signing Secret` e adicione como `STRIPE_WEBHOOK_SECRET`

---

## Deploy do Frontend

### 1. Configurar Variáveis de Ambiente

**Criar `.env.production`:**
```env
VITE_API_URL=https://aqw-skins-backend.onrender.com/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_live_...
VITE_PAYPAL_CLIENT_ID=...
```

**Commit:**
```bash
git add frontend/.env.production
git commit -m "Add production env"
git push origin main
```

### 2. Deploy no Vercel

1. Acesse https://vercel.com
2. Conecte GitHub
3. Clique em "New Project"
4. Selecione `AQWSkins`

**Configurações:**
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Variáveis de Ambiente no Vercel

Em "Environment Variables", adicione:
```
VITE_API_URL = https://aqw-skins-backend.onrender.com/api/v1
VITE_STRIPE_PUBLIC_KEY = pk_live_...
VITE_PAYPAL_CLIENT_ID = ...
```

### 4. Deploy

Clique em "Deploy". Vercel irá:
1. Build automático
2. Deploy para CDN global
3. Atribuir domínio: `https://aqw-skins.vercel.app`

### 5. Domínio Customizado (Opcional)

1. Compre domínio (ex: Namecheap, GoDaddy)
2. No Vercel: Settings → Domains → Add Domain
3. Configure DNS:
   - Type: A
   - Name: @
   - Value: 76.76.21.21 (Vercel IP)
   
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com

---

## Configuração de DNS e SSL

### CloudFlare (Opcional - CDN + DDoS Protection)

1. Crie conta no CloudFlare
2. Adicione seu domínio
3. Atualize Nameservers no registrador:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

4. Configure SSL:
   - SSL/TLS → Overview → Full (strict)
   - Edge Certificates → Always Use HTTPS: ON

5. Configure Cache:
   - Caching → Configuration → Caching Level: Standard

6. Configure Firewall:
   - Security → WAF → ON
   - Rate Limiting: 100 req/min por IP

---

## Configuração de Pagamentos

### Stripe

1. **Modo de Teste:**
   - Chaves começam com `sk_test_` e `pk_test_`
   - Use cartões de teste: 4242 4242 4242 4242

2. **Modo Produção:**
   - Complete verificação de identidade
   - Ative conta
   - Use chaves `sk_live_` e `pk_live_`

3. **Webhook Testing Local:**
```bash
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
```

### PayPal

1. Acesse https://developer.paypal.com
2. Crie App em "My Apps & Credentials"
3. Copie Client ID e Secret
4. Para produção: Switch para "Live" no dashboard

### PIX (Brasil)

1. Integração via Mercado Pago ou PagSeguro
2. Configure webhook para confirmação
3. Gere QR Code dinâmico por transação

---

## Monitoramento

### 1. Sentry (Error Tracking)

```bash
npm install @sentry/node @sentry/react
```

**Backend:**
```javascript
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

**Frontend:**
```javascript
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

### 2. LogRocket (Session Replay)

```bash
npm install logrocket
```

```javascript
import LogRocket from 'logrocket';
LogRocket.init(import.meta.env.VITE_LOGROCK_APP_ID);
```

### 3. Uptime Monitoring

Use UptimeRobot ou Better Uptime:
- Monitor: `https://aqw-skins.vercel.app/health`
- Intervalo: 5 minutos
- Alertas: Email/SMS

---

## Backup e Recuperação

### 1. Backup Automático do Neon

Neon faz backup automático a cada hora. Para restaurar:
1. Dashboard → Backups
2. Selecione ponto de restauração
3. Crie novo branch ou restaure

### 2. Backup Manual

```bash
pg_dump "postgresql://user:pass@host/db" > backup-$(date +%Y%m%d).sql
```

### 3. Cron Job de Backup (Backend)

**Em `utils/cronJobs.js`:**
```javascript
cron.schedule('0 2 * * *', async () => {
  const { exec } = require('child_process');
  exec(`pg_dump "${process.env.DATABASE_URL}" > backup-${Date.now()}.sql`);
  logger.info('Database backup completed');
});
```

---

## Checklist de Deploy

### Pré-Deploy
- [ ] Testar localmente em modo produção
- [ ] Executar linter (ESLint)
- [ ] Testar endpoints principais
- [ ] Verificar variáveis de ambiente
- [ ] Revisar logs de erro

### Durante Deploy
- [ ] Database migrations executadas
- [ ] Seed de dados iniciais (se necessário)
- [ ] Backend deployado e rodando
- [ ] Frontend buildado e servido
- [ ] Webhooks configurados
- [ ] SSL certificado ativo

### Pós-Deploy
- [ ] Testar registro de usuário
- [ ] Testar login/logout
- [ ] Testar abertura de loot box
- [ ] Testar depósito (modo teste)
- [ ] Testar saque de item
- [ ] Testar exchanger
- [ ] Testar sell-back de item
- [ ] Testar admin dashboard
- [ ] Verificar emails (SMTP)
- [ ] Verificar logs (Sentry)

---

## Comandos Úteis

### Render CLI
```bash
# Instalar
npm install -g render-cli

# Login
render login

# Ver logs
render logs -s aqw-skins-backend

# Redeploy
render deploy -s aqw-skins-backend
```

### Vercel CLI
```bash
# Instalar
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Ver logs
vercel logs
```

---

## Troubleshooting

### Backend não inicia
1. Verifique logs no Render
2. Confirme variáveis de ambiente
3. Teste conexão com database:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend com erro 404 na API
1. Verifique `VITE_API_URL` no Vercel
2. Confirme CORS no backend
3. Teste endpoint diretamente:
```bash
curl https://aqw-skins-backend.onrender.com/health
```

### Pagamento não funciona
1. Verifique chaves Stripe (test vs live)
2. Confirme webhook configurado
3. Teste com cartão de teste primeiro

---

## Próximos Passos

1. **Analytics**: Google Analytics ou Plausible
2. **A/B Testing**: Posthog ou Optimizely
3. **CDN**: CloudFlare ou Fastly
4. **Email Marketing**: SendGrid ou Mailchimp
5. **Customer Support**: Intercom ou Zendesk

---

## Contato

Dúvidas sobre deploy? 
- 📧 Email: dev@aqw-skins.com
- 📚 Docs: https://docs.aqw-skins.com

---

**Deploy realizado com sucesso! 🎉**
