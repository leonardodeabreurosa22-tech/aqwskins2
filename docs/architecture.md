# AQW Skins - Documentação de Arquitetura

## Visão Geral do Sistema

O AQW Skins é uma plataforma de loot box provably fair para Adventure Quest Worlds, com suporte multi-idioma e multi-moeda, sistema de inventário completo, cupons de influenciadores e exchanger de itens.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │  Home/UI   │  │ Loot Boxes │  │ Inventory/Withdraw  │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ Exchanger  │  │  Deposit   │  │  Admin Dashboard    │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Node.js/Express)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Authentication & Security              │    │
│  │    JWT, RBAC, Rate Limiting, CSRF, Fingerprinting  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────────┐   │
│  │  Lootbox  │  │ Withdraw │  │  Deposit/Currency      │   │
│  │  Service  │  │ Service  │  │     Service            │   │
│  └───────────┘  └──────────┘  └────────────────────────┘   │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────────┐   │
│  │ Exchanger │  │  Coupon  │  │    Ticket/Support      │   │
│  │  Service  │  │ Service  │  │      Service           │   │
│  └───────────┘  └──────────┘  └────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Fairness Engine (Provably Fair RNG)          │    │
│  │   crypto.randomInt + HMAC + Audit Logs + Weights   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                DATABASE (PostgreSQL/Neon)                    │
│  ┌────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐     │
│  │ Users  │ │ Items   │ │ Lootboxes │ │ Item Codes   │     │
│  └────────┘ └─────────┘ └───────────┘ └──────────────┘     │
│  ┌──────────┐ ┌─────────────┐ ┌──────────┐ ┌─────────┐    │
│  │Inventory │ │ Withdrawals │ │ Deposits │ │ Coupons │    │
│  └──────────┘ └─────────────┘ └──────────┘ └─────────┘    │
│  ┌──────────────┐ ┌───────────┐ ┌─────────────────────┐   │
│  │ Lootbox Logs │ │ Exchanges │ │   Audit Logs        │   │
│  └──────────────┘ └───────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │   Stripe   │  │   PayPal    │  │  Exchange Rate   │     │
│  │  (Payment) │  │  (Payment)  │  │      API         │     │
│  └────────────┘  └─────────────┘  └──────────────────┘     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │    PIX     │  │   SendGrid  │  │    Cloudflare    │     │
│  │  (Brazil)  │  │   (Email)   │  │      (CDN)       │     │
│  └────────────┘  └─────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Frontend (React)
- **Responsabilidades**: UI/UX, interação do usuário, validação client-side
- **Tecnologias**: React, React Router, i18next, Axios, TailwindCSS
- **Features**:
  - Loot box opening animation
  - Inventário com filtros e ordenação
  - Sistema de troca (exchanger) com preview
  - Depósito multi-moeda
  - Painel de administração

### 2. Backend API (Node.js/Express)
- **Responsabilidades**: Lógica de negócio, autenticação, autorização, fairness
- **Tecnologias**: Express, JWT, bcrypt, crypto, PostgreSQL
- **Arquitetura em Camadas**:
  - **Routes**: Endpoints da API
  - **Controllers**: Lógica de controle
  - **Services**: Lógica de negócio
  - **Middlewares**: Autenticação, validação, rate limiting
  - **Utils**: Helpers, crypto, logs

### 3. Database (PostgreSQL/Neon)
- **Responsabilidades**: Persistência de dados, integridade, auditoria
- **Tabelas Principais**:
  - `users`: Usuários e credenciais
  - `items`: Itens/skins do AQW
  - `item_codes`: Estoque de códigos
  - `lootboxes`: Configuração de caixas
  - `inventory`: Inventário dos usuários
  - `lootbox_openings`: Log de aberturas (fairness)
  - `withdrawals`: Retiradas de itens
  - `deposits`: Depósitos de créditos
  - `coupons`: Cupons de influenciadores
  - `coupon_usage`: Anti-abuso de cupons
  - `exchanges`: Histórico de trocas
  - `audit_logs`: Logs de auditoria

## Fluxos Principais

### Fluxo de Abertura de Loot Box

```
1. Usuário → [Clicar "Abrir Caixa"]
2. Frontend → Validar saldo
3. Frontend → POST /api/v1/lootboxes/:id/open + fingerprint
4. Backend → Autenticar JWT
5. Backend → Rate Limiting Check
6. Backend → Transaction Start
7. Backend → Verificar saldo do usuário
8. Backend → Debitar créditos
9. Backend → Executar Algoritmo Fairness:
   a. Obter configuração da caixa (items + weights)
   b. Calcular totalWeight
   c. Gerar random seguro: crypto.randomInt(1, totalWeight)
   d. Selecionar item baseado em distribuição ponderada
   e. Gerar HMAC(itemId + userId + timestamp, secretSeed)
10. Backend → Adicionar item ao inventário
11. Backend → Registrar log de abertura com fairness hash
12. Backend → Atualizar estatísticas
13. Backend → Transaction Commit
14. Backend → Retornar { item, fairnessHash, newBalance }
15. Frontend → Animação de abertura
16. Frontend → Exibir item ganho + hash de verificação
```

### Fluxo de Withdrawal

```
1. Usuário → Selecionar item do inventário
2. Frontend → POST /api/v1/withdrawals
3. Backend → Verificar propriedade do item
4. Backend → Verificar requisitos (depósito mínimo se coupon)
5. Backend → Transaction Start
6. Backend → Buscar código disponível:
   a. SELECT code FROM item_codes WHERE item_id = X AND status = 'available' LIMIT 1
   b. SE código encontrado:
      - Marcar código como 'used'
      - Entregar código imediatamente
      - Status = 'completed'
   c. SE código NÃO encontrado:
      - Status = 'pending_manual'
      - Notificar admin
      - Mensagem: "Entrega manual em até 3 dias úteis"
7. Backend → Atualizar status do item no inventário
8. Backend → Criar registro de withdrawal
9. Backend → Transaction Commit
10. Backend → Retornar resultado com código (ou mensagem de pendência)
11. Frontend → Exibir código ou aviso de processamento manual
```

### Fluxo de Cupom de Influenciador

```
1. Usuário → Inserir código de cupom
2. Frontend → POST /api/v1/coupons/use { code, fingerprint }
3. Backend → Validar cupom (ativo, não expirado, limite não atingido)
4. Backend → Gerar hash de fingerprint (IP + UserAgent + Canvas data)
5. Backend → Verificar se já foi usado:
   SELECT * FROM coupon_usage WHERE coupon_id = X AND fingerprint = Y
6. Backend → SE já usado → Erro "Cupom já utilizado"
7. Backend → SE não usado:
   a. Transaction Start
   b. Executar loot box do cupom (items + weights configurados)
   c. Adicionar item ao inventário com source_type = 'coupon'
   d. Registrar uso do cupom
   e. Incrementar times_used
   f. Transaction Commit
8. Backend → Retornar { item, minimumDepositRequired, canWithdrawImmediately }
9. Frontend → Exibir item ganho + requisitos de withdrawal
```

## Segurança

### Camadas de Segurança

1. **HTTPS**: TLS 1.3 obrigatório
2. **Helmet**: Headers de segurança
3. **CORS**: Whitelist de origens
4. **Rate Limiting**: Por IP e por usuário
5. **Input Validation**: express-validator + Joi
6. **SQL Injection**: Parameterized queries
7. **XSS Protection**: Sanitização de inputs
8. **CSRF Protection**: Tokens em formulários
9. **JWT**: Tokens com expiração curta
10. **Fingerprinting**: Anti-abuso de cupons

### Fairness & Auditoria

- **Seed Secreto**: Rotacionado semanalmente
- **HMAC**: Verificação pública do resultado
- **Logs Imutáveis**: Todos os sorteios registrados
- **Weights Ocultos**: Probabilidades exatas apenas para admin
- **Timestamps**: Lock de sorteio no tempo
- **Audit Trail**: Todas ações críticas logadas

## Escalabilidade

### Horizontal Scaling
- Backend stateless (JWT)
- Load balancer (Nginx/CloudFlare)
- Database connection pooling
- Redis cache (sessions, rates)

### Performance
- Database indexes otimizados
- Query optimization (EXPLAIN ANALYZE)
- CDN para assets estáticos
- Compression (gzip/brotli)
- Lazy loading no frontend

## Monitoramento

### Logs
- **combined.log**: Todas operações
- **error.log**: Erros
- **audit.log**: Ações críticas de admin
- **fairness.log**: Todos os sorteios
- **transactions.log**: Depósitos/withdrawals

### Métricas
- Taxa de abertura de loot boxes
- Valor médio de depósito
- Taxa de conversão
- Distribuição de itens
- Tempo de resposta de APIs
- Erros por endpoint

## Deploy

### Produção
- **Frontend**: Vercel (CDN global, auto-scaling)
- **Backend**: Render.com ou Railway (auto-deploy via Git)
- **Database**: Neon Postgres (serverless, backups automáticos)
- **CDN**: CloudFlare (DDoS protection, cache)
- **Monitoring**: LogRocket, Sentry

### Ambientes
- **Development**: Local (Docker Compose)
- **Staging**: Deploy preview branches
- **Production**: Main branch auto-deploy

## Internacionalização

### Idiomas Suportados
- 🇺🇸 English (EN)
- 🇧🇷 Português Brasil (PT-BR)
- 🇪🇸 Español (ES)
- 🇵🇭 Filipino (FIL)

### Moedas Suportadas
- 💵 USD (base)
- 💵 BRL
- 💶 EUR
- 💵 PHP

### Auto-detecção
1. Header `Accept-Language`
2. IP Geolocation
3. User preference (salva no perfil)
4. Fallback: EN/USD

## Backup & Recovery

### Backups Diários
- Cron job às 2 AM
- Backup completo do PostgreSQL
- Retenção: 30 dias
- Armazenamento: AWS S3 ou equivalente

### Disaster Recovery
1. Restore do último backup
2. Replay de transaction logs
3. Verificação de integridade
4. Testes de restore mensais

---

**Versão**: 1.0.0  
**Última Atualização**: 30/11/2025  
**Autor**: AQW Skins Development Team
