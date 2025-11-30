# Guia de Deploy - AQW Skins

## Visão Geral

Este guia detalha o processo completo de deploy da plataforma AQW Skins em produção.

## Stack de Produção

- **Frontend**: Vercel (CDN Global)
- **Backend**: Render.com / Railway
- **Database**: Neon Postgres (Serverless)
- **CDN/WAF**: CloudFlare
- **Monitoring**: Sentry + LogRocket
- **Email**: SendGrid
- **Storage**: AWS S3 (backups)

---

## 1. Preparação do Ambiente

### 1.1 Requisitos

- [ ] Conta Vercel
- [ ] Conta Render/Railway
- [ ] Conta Neon Database
- [ ] Conta CloudFlare
- [ ] Domínio próprio
- [ ] Contas de pagamento (Stripe, PayPal)
- [ ] Git repository configurado

### 1.2 Checklist Pré-Deploy

- [ ] Todas variáveis de ambiente documentadas
- [ ] Seeds de fairness gerados e seguros
- [ ] Chaves de API de pagamento (LIVE mode)
- [ ] Email templates configurados
- [ ] Backup strategy definida
- [ ] Monitoring configurado
- [ ] SSL certificates prontos

---

## 2. Deploy do Database (Neon)

### 2.1 Criar Database

```bash
# 1. Acessar https://neon.tech
# 2. Criar novo projeto: "aqw-skins-prod"
# 3. Região: Selecionar mais próxima dos usuários
# 4. Copiar connection string
```

### 2.2 Executar Migrations

```bash
# Conectar ao database
psql "postgresql://user:pass@host/db?sslmode=require"

# Executar schema
\i database/schema.sql

# Verificar tabelas
\dt

# Verificar views
\dv
```

### 2.3 Seed Inicial (Opcional)

```bash
# Dados iniciais (admin, configurações)
\i database/seed.sql
```

### 2.4 Configurar Backups

```sql
-- Habilitar Point-in-Time Recovery
-- (Feito via Dashboard do Neon)

-- Configurar retention
-- Mínimo: 7 dias
-- Recomendado: 30 dias
```

### 2.5 Connection Pooling

```bash
# Neon oferece connection pooling nativo
# Connection string format:
# postgresql://user:pass@pooler.region.neon.tech/db?sslmode=require

# Configurar:
# - Max connections: 100
# - Pool mode: Transaction
```

---

## 3. Deploy do Backend (Render.com)

### 3.1 Preparar Repositório

```bash
# Verificar que backend/ está pronto
cd backend

# Testar localmente
npm install
npm run build
npm start
```

### 3.2 Criar Web Service no Render

```yaml
# render.yaml
services:
  - type: web
    name: aqw-skins-api
    env: node
    region: oregon # ou mais próximo
    plan: starter # ou standard
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false # Adicionar via Dashboard (secret)
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: FAIRNESS_SECRET_SEED
        generateValue: true
      - key: HMAC_SECRET
        generateValue: true
      - key: ENCRYPTION_KEY
        generateValue: true
```

### 3.3 Configurar Variáveis de Ambiente

```bash
# Via Render Dashboard, adicionar:

# Database
DATABASE_URL=postgresql://...

# API URLs
API_URL=https://api.aqw-skins.com
FRONTEND_URL=https://aqw-skins.com
ADMIN_URL=https://admin.aqw-skins.com

# Secrets (GERAR NOVOS!)
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
FAIRNESS_SECRET_SEED=<generated>
HMAC_SECRET=<generated>
ENCRYPTION_KEY=<32 hex characters>

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
PAYPAL_MODE=live

# Email
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG....
EMAIL_FROM=noreply@aqw-skins.com

# Exchange Rate API
EXCHANGE_RATE_API_KEY=...
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest

# Features
MAINTENANCE_MODE=false
BACKUP_ENABLED=true
```

### 3.4 Deploy

```bash
# Render auto-deploys from Git
# Push to main branch triggers deployment

git add .
git commit -m "Production deployment"
git push origin main

# Monitor logs no Render Dashboard
```

### 3.5 Verificar Deploy

```bash
# Health check
curl https://api.aqw-skins.com/health

# Verificar response
{
  "status": "OK",
  "timestamp": "2025-11-30T...",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## 4. Deploy do Frontend (Vercel)

### 4.1 Preparar Build

```bash
cd frontend

# Build de produção
npm install
npm run build

# Testar build
npm run preview
```

### 4.2 Configurar Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Linkar projeto
vercel link

# Configurar environment variables
vercel env add VITE_API_URL production
# Valor: https://api.aqw-skins.com/api/v1

vercel env add VITE_SOCKET_URL production
# Valor: https://api.aqw-skins.com
```

### 4.3 Deploy

```bash
# Deploy de produção
vercel --prod

# Ou via Git (auto-deploy)
git push origin main
```

### 4.4 Configurar Domínio

```bash
# Via Vercel Dashboard:
# 1. Settings > Domains
# 2. Adicionar: aqw-skins.com
# 3. Configurar DNS:

# No CloudFlare:
# Tipo: CNAME
# Nome: @
# Valor: cname.vercel-dns.com
# Proxy: ON (Orange cloud)

# Admin subdomain:
# Tipo: CNAME
# Nome: admin
# Valor: cname.vercel-dns.com
```

---

## 5. Configurar CloudFlare

### 5.1 DNS

```
Type    Name    Content                     Proxy
------------------------------------------------------
CNAME   @       cname.vercel-dns.com        ON
CNAME   admin   cname.vercel-dns.com        ON
CNAME   api     aqw-skins-api.onrender.com  ON
```

### 5.2 Security Settings

```yaml
# SSL/TLS
Mode: Full (strict)
Always Use HTTPS: ON
Minimum TLS Version: 1.2
Automatic HTTPS Rewrites: ON

# Firewall Rules
- Block countries: None (or selecionar se necessário)
- Challenge on high threat score: ON
- Rate limiting: 100 req/10s per IP

# DDoS Protection
- HTTP DDoS: ON (automatic)
- Network DDoS: ON (automatic)

# WAF
- Managed Rules: ON
- OWASP Core Ruleset: ON

# Caching
- Browser Cache TTL: 4 hours
- Cache Level: Standard
- Always Online: ON
```

### 5.3 Page Rules

```
1. api.aqw-skins.com/*
   - Cache Level: Bypass
   
2. aqw-skins.com/assets/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   
3. aqw-skins.com/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 2 hours
```

---

## 6. Configurar Monitoring

### 6.1 Sentry (Error Tracking)

```bash
# Instalar SDK
npm install @sentry/node @sentry/react

# Backend (src/server.js)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://...@sentry.io/...",
  environment: "production",
  tracesSampleRate: 0.1,
});

# Frontend (src/main.jsx)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://...@sentry.io/...",
  environment: "production",
});
```

### 6.2 LogRocket (Session Replay)

```bash
# Frontend only
npm install logrocket

# src/main.jsx
import LogRocket from 'logrocket';

if (import.meta.env.PROD) {
  LogRocket.init('app/id');
}
```

### 6.3 Uptime Monitoring

```bash
# Usar UptimeRobot ou similar
# Monitorar:
- https://aqw-skins.com (5 min interval)
- https://api.aqw-skins.com/health (1 min interval)

# Alertas:
- Email
- Slack/Discord webhook
```

---

## 7. Configurar Webhooks de Pagamento

### 7.1 Stripe Webhooks

```bash
# Dashboard Stripe > Developers > Webhooks
# Endpoint: https://api.aqw-skins.com/api/v1/webhooks/stripe
# Events:
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded

# Copiar Signing Secret
# Adicionar em ENV: STRIPE_WEBHOOK_SECRET
```

### 7.2 PayPal Webhooks

```bash
# Dashboard PayPal > Developer > Webhooks
# Endpoint: https://api.aqw-skins.com/api/v1/webhooks/paypal
# Events:
- PAYMENT.CAPTURE.COMPLETED
- PAYMENT.CAPTURE.DENIED

# Configurar no backend
```

---

## 8. Backup & Recovery

### 8.1 Database Backups Automáticos

```bash
# Via Neon Dashboard:
# - Point-in-Time Recovery: Enabled
# - Retention: 30 days
# - Daily snapshots: Enabled

# Backup adicional via Cron (opcional)
# Ver: backend/src/utils/cronJobs.js
```

### 8.2 Backup Manual

```bash
# Fazer backup completo
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql

# Comprimir
gzip backup_$(date +%Y%m%d).sql

# Upload para S3
aws s3 cp backup_*.sql.gz s3://aqw-skins-backups/
```

### 8.3 Restore de Backup

```bash
# Download do S3
aws s3 cp s3://aqw-skins-backups/backup_20251130.sql.gz .

# Descomprimir
gunzip backup_20251130.sql.gz

# Restore
psql "postgresql://..." < backup_20251130.sql
```

---

## 9. Pós-Deploy Checklist

### 9.1 Testes Funcionais

- [ ] Registro de usuário funciona
- [ ] Login funciona
- [ ] Abertura de loot box funciona
- [ ] Fairness hash é gerado
- [ ] Depósito funciona (teste com $1)
- [ ] Withdrawal funciona
- [ ] Exchanger funciona
- [ ] Cupom de influenciador funciona
- [ ] Tickets de suporte funcionam
- [ ] Multi-idioma funciona (EN, PT-BR, ES, FIL)
- [ ] Multi-moeda funciona (USD, BRL, EUR, PHP)

### 9.2 Testes de Segurança

- [ ] HTTPS funciona (SSL válido)
- [ ] CORS está configurado
- [ ] Rate limiting funciona
- [ ] JWT expira corretamente
- [ ] Senhas são hasheadas
- [ ] SQL injection está bloqueado
- [ ] XSS está bloqueado
- [ ] CSRF protection funciona

### 9.3 Testes de Performance

- [ ] API response time < 200ms
- [ ] Frontend load time < 2s
- [ ] Lootbox opening < 500ms
- [ ] Database queries otimizadas
- [ ] CDN serving assets
- [ ] Images comprimidas

### 9.4 Monitoring Ativo

- [ ] Sentry recebendo erros
- [ ] LogRocket gravando sessões
- [ ] Uptime monitor ativo
- [ ] Logs sendo gerados
- [ ] Alertas configurados

---

## 10. Manutenção Contínua

### 10.1 Tarefas Semanais

```bash
# Domingo 3 AM (automático via cron):
- Rotação de seed de fairness
- Limpeza de sessões expiradas
- Verificação de anomalias de distribuição
```

### 10.2 Tarefas Mensais

```bash
# Revisar:
- Logs de erro (top 10 erros)
- Performance metrics
- Database size e crescimento
- Custo de infraestrutura
- Backups (testar restore)
```

### 10.3 Updates

```bash
# Atualizar dependências
npm outdated
npm update

# Security patches
npm audit fix

# Deploy de updates
git push origin main
```

---

## 11. Rollback de Emergência

### 11.1 Rollback do Frontend

```bash
# Vercel Dashboard > Deployments
# Selecionar deployment anterior
# Promote to Production
```

### 11.2 Rollback do Backend

```bash
# Render Dashboard > Deploys
# Selecionar deploy anterior
# Redeploy
```

### 11.3 Rollback do Database

```bash
# Via Neon Dashboard:
# Branches > Create branch from backup
# Point to timestamp antes do problema
# Update connection string
```

---

## 12. Contatos de Emergência

```
Database Issues: support@neon.tech
Backend Issues: support@render.com
Frontend Issues: support@vercel.com
DNS/CDN Issues: support@cloudflare.com
Payment Issues: support@stripe.com
```

---

## Custos Estimados (Mensal)

```
Neon Database (Starter): $19/mês
Render (Starter): $7/mês
Vercel (Hobby): $0/mês (Pro: $20/mês)
CloudFlare (Free): $0/mês (Pro: $20/mês)
SendGrid: $0-15/mês
Sentry: $0-26/mês
AWS S3: ~$5/mês

TOTAL: ~$31-112/mês (dependendo do plano)
```

---

**Deploy completo! 🚀**

**URL de Produção**: https://aqw-skins.com  
**API**: https://api.aqw-skins.com  
**Status**: https://status.aqw-skins.com
