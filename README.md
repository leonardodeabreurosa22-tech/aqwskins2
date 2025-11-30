# 🎮 AQW Skins - Complete Loot Box Platform

![AQW Skins](https://img.shields.io/badge/Status-Complete-success)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

**Adventure Quest Worlds Loot Box Platform** - Sistema completo de loot boxes com sistema provably fair, multi-idioma, multi-moeda, exchanger e conversão de itens em créditos.

## ✨ Funcionalidades Implementadas (100%)

### Para Usuários
- ✅ **Loot Boxes** com animações em 4 estágios + confetti
- ✅ **Sistema Provably Fair** verificável (HMAC-SHA256)
- ✅ **Inventário** com filtros e ordenação
- ✅ **Venda de Itens** por créditos (sell-back system)
- ✅ **Exchanger** com fee de 5% e refund automático
- ✅ **Depósitos** via Stripe, PayPal e PIX
- ✅ **Perfil** com estatísticas e histórico completo
- ✅ **Multi-idioma**: EN, PT-BR, ES, Filipino
- ✅ **Multi-moeda**: USD, BRL, EUR, PHP

### Para Administradores
- ✅ **Dashboard** com estatísticas em tempo real
- ✅ **CRUD** de loot boxes e itens
- ✅ **Gerenciamento** de usuários (ban/unban, roles)
- ✅ **Aprovação** de saques manuais
- ✅ **Gerador** de cupons com anti-abuse
- ✅ **Audit Logs** completos

## 📁 Estrutura do Projeto

```
/frontend          → Interface React com i18n e multi-moeda
/backend           → API Node.js/Express com lógica de negócio
/database          → Modelos Postgres/Neon, migrations, backups
/admin             → Painel administrativo e moderação
/locales           → Arquivos de tradução (EN, PT-BR, ES, FIL)
/tests             → Testes unitários, integração, fairness
/docs              → Documentação, diagramas, APIs, guias
/public-how-it-works → Página pública educativa multilíngue
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (ou Neon Database)
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/aqw-skins.git
cd aqw-skins

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais
```

### Configuração do Banco de Dados

```bash
cd database
npm install
npm run migrate
npm run seed
```

### Executar em Desenvolvimento

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Admin Panel
cd admin
npm run dev
```

## 🔐 Segurança

- **HTTPS Obrigatório** em produção
- **JWT Authentication** com refresh tokens
- **RBAC** (Role-Based Access Control) para admin/moderador
- **Rate Limiting** em todas rotas críticas
- **Input Sanitization** e validação rigorosa
- **CSRF Protection** em formulários
- **Browser Fingerprinting** anti-abuso
- **Logs Auditáveis** de todas operações críticas
- **Seed Rotation** periódica para fairness

## 🎲 Sistema de Fairness

O algoritmo de sorteio utiliza:

1. **Crypto-secure Random** (crypto.randomInt)
2. **Weighted Distribution** configurável por caixa
3. **HMAC Verification** para auditoria
4. **Timestamp Locking** anti-manipulação
5. **Logs Completos** de cada abertura

Veja [docs/fairness.md](docs/fairness.md) para detalhes técnicos.

## 💳 Sistema de Pagamentos

Suporte a:

- Cartões de Crédito/Débito (PCI DSS compliant)
- PIX (Brasil)
- Boleto Bancário (Brasil)
- PayPal
- Stripe
- Conversão automática de moedas via API

## 📊 Painel Administrativo

Funcionalidades:

- ✅ Gerenciar caixas e itens
- ✅ Configurar probabilidades e pesos
- ✅ Controle de estoque de códigos
- ✅ Gestão de cupons de influenciadores
- ✅ Dashboard com estatísticas em tempo real
- ✅ Logs e auditoria completa
- ✅ Aprovação manual de withdrawals
- ✅ Gerenciamento de usuários e permissões
- ✅ Sistema de tickets e moderação

## 🌐 Internacionalização

Idiomas suportados com tradução completa:

- 🇺🇸 English (EN)
- 🇧🇷 Português Brasil (PT-BR)
- 🇪🇸 Español (ES)
- 🇵🇭 Filipino (FIL)

Moedas suportadas:

- 💵 USD (Dólar Americano)
- 💵 BRL (Real Brasileiro)
- 💶 EUR (Euro)
- 💵 PHP (Peso Filipino)

## 📖 Documentação

- [Arquitetura do Sistema](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Algoritmo de Fairness](docs/fairness.md)
- [Guia do Administrador](docs/admin-guide.md)
- [Guia do Moderador](docs/moderator-guide.md)
- [Guia de Contribuição](docs/contributing.md)
- [Deploy Guide](docs/deployment.md)
- [Security Best Practices](docs/security.md)

## 🧪 Testes

```bash
# Rodar todos os testes
npm test

# Testes de fairness
npm run test:fairness

# Testes de segurança
npm run test:security

# Coverage report
npm run test:coverage
```

## 🚢 Deploy

### Backend (Render.com)

```bash
cd backend
npm run build
# Deploy via Render dashboard ou CLI
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

### Database (Neon)

- Configure string de conexão no `.env`
- Execute migrations: `npm run migrate:prod`

Veja [docs/deployment.md](docs/deployment.md) para instruções detalhadas.

## 📝 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](CONTRIBUTING.md) para guidelines.

## 📧 Contato & Suporte

- Website: https://aqw-skins.com
- Email: support@aqw-skins.com
- Discord: [Link do servidor]

## ⚠️ Disclaimer

Este projeto é uma plataforma de entretenimento. Use com responsabilidade. Não incentivamos jogos de azar para menores de 18 anos. Consulte as leis locais sobre jogos online em sua região.

---

**Desenvolvido com ❤️ para a comunidade Adventure Quest Worlds**
