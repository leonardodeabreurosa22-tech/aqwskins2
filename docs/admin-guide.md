# Guia do Administrador - AQW Skins

## Introdução

Este guia é destinado a administradores da plataforma AQW Skins. Você tem controle total sobre o sistema, incluindo gerenciamento de usuários, loot boxes, itens, cupons, withdrawals manuais e muito mais.

## Acesso ao Painel Admin

**URL**: `https://admin.aqw-skins.com` ou `https://aqw-skins.com/admin`

**Credenciais Iniciais**:
- Email: `admin@aqw-skins.com`
- Senha: (definida no primeiro acesso)

⚠️ **IMPORTANTE**: Altere a senha padrão imediatamente após o primeiro login!

---

## 1. Dashboard Principal

### 1.1 Visão Geral

O dashboard exibe:
- Total de usuários ativos
- Total de loot boxes abertas (hoje, semana, mês)
- Total depositado (hoje, semana, mês)
- Total de withdrawals pendentes
- Gráficos de atividade

### 1.2 Alertas Importantes

🔴 **Atenção Imediata**:
- Withdrawals pendentes > 48 horas
- Estoque de códigos baixo
- Anomalias na distribuição de itens
- Erros críticos no sistema

🟡 **Revisar Hoje**:
- Tickets de suporte abertos
- Usuários suspensos
- Depósitos falhados

---

## 2. Gerenciamento de Loot Boxes

### 2.1 Criar Nova Loot Box

```
Admin Panel > Loot Boxes > Create New

Campos:
- Nome: "Epic Heroes Box"
- Descrição: "Contains legendary AQW items"
- Preço: 10.00 USD
- Categoria: "premium"
- Nível Mínimo: 5
- Imagem: upload ou URL
- Status: active/inactive/coming_soon

Configuração de Itens:
[
  { "id": 101, "weight": 8000 },  // 80% chance
  { "id": 102, "weight": 1500 },  // 15% chance
  { "id": 103, "weight": 450 },   // 4.5% chance
  { "id": 104, "weight": 49 },    // 0.49% chance
  { "id": 105, "weight": 1 }      // 0.01% chance (ultra rare)
]

Total Weight: 10,000 (sempre somar para 10,000)
```

### 2.2 Editar Loot Box Existente

⚠️ **CUIDADO**: Alterar pesos/items afeta a fairness. Faça apenas quando necessário.

**Boas Práticas**:
1. Sempre documente mudanças
2. Notifique usuários se probabilidades mudarem significativamente
3. Mantenha histórico de configurações anteriores

### 2.3 Desativar Loot Box

```
Status > Inactive

NOTA: Usuários não poderão mais abrir, mas histórico permanece.
```

### 2.4 Analisar Performance

```
Admin Panel > Loot Boxes > [Nome da Box] > Statistics

Métricas:
- Total de aberturas
- Receita total gerada
- Distribuição de itens (por rarity)
- Taxa de conversão (usuários que abriram)
```

---

## 3. Gerenciamento de Itens

### 3.1 Adicionar Novo Item

```
Admin Panel > Items > Add New

Campos:
- Nome: "Legendary Dragon Sword"
- Descrição: "The most powerful weapon in AQW"
- Categoria: "weapon"
- Rarity: legendary
- Valor (USD): 50.00
- Imagem: URL
- Requer Depósito: no (ou yes para itens de cupons)
```

### 3.2 Gerenciar Estoque de Códigos

**Adicionar Códigos (Individual)**:
```
Admin Panel > Items > [Item Name] > Codes > Add Code

Código: AQWD-1234-5678-ABCD
Batch ID: (opcional, para organizar)
```

**Adicionar Códigos (Em Lote)**:
```
Admin Panel > Items > [Item Name] > Codes > Bulk Import

Format CSV:
code,batch_id
AQWD-1234-5678-ABCD,batch_001
AQWD-2345-6789-BCDE,batch_001
AQWD-3456-7890-CDEF,batch_001

Upload CSV > Import
```

### 3.3 Alertas de Estoque

⚠️ **Sistema alerta quando**:
- < 10 códigos disponíveis para item comum
- < 5 códigos disponíveis para item raro/épico
- 0 códigos disponíveis (withdrawal automático para)

**Ação Recomendada**:
1. Comprar/gerar mais códigos
2. Adicionar ao sistema imediatamente
3. Processar withdrawals pendentes manualmente

---

## 4. Gerenciamento de Cupons de Influenciadores

### 4.1 Criar Novo Cupom

```
Admin Panel > Coupons > Create New

Campos:
- Código: STREAMER2024 (maiúsculas, sem espaços)
- Nome do Influenciador: "GamerPro"
- URL do Influenciador: https://twitch.tv/gamerpro
- Depósito Mínimo para Withdrawal: 10.00 USD
- Usos Máximos: 1000 (ou null para ilimitado)
- Expira em: 2025-12-31 (ou null para sem expiração)

Configuração da Loot Box:
[
  { "id": 201, "weight": 9900 },  // Item barato 99%
  { "id": 202, "weight": 95 },    // Item médio 0.95%
  { "id": 203, "weight": 4 },     // Item caro 0.04%
  { "id": 204, "weight": 1 }      // Item ultra raro 0.01%
]

Lógica:
- Usuário usa cupom → ganha item da box acima
- SE item_id = 203 ou 204 (caros):
  - Precisa depositar $10+ antes de fazer withdrawal
- SE item_id = 201 ou 202:
  - Pode fazer withdrawal imediatamente
```

### 4.2 Monitorar Uso de Cupons

```
Admin Panel > Coupons > [Code] > Usage Statistics

Informações:
- Total de usos: 547 / 1000
- Usuários únicos: 547
- Itens distribuídos:
  • Item 201: 542 (99.08%)
  • Item 202: 4 (0.73%)
  • Item 203: 1 (0.18%)
  • Item 204: 0 (0%)
- Depósitos gerados: $2,340.00
- Taxa de conversão: 42.8% (547 usos → 234 depósitos)
```

### 4.3 Desativar Cupom

```
Status > Inactive

Motivo comum: Campanha encerrada, limite atingido, abuso detectado
```

### 4.4 Detectar Abuso de Cupons

⚠️ **Sinais de Alerta**:
- Múltiplos usos do mesmo IP
- Múltiplos usos em curto espaço de tempo
- Padrões de fingerprint similares

**Sistema Anti-Abuso**:
- 1 uso por IP/dispositivo/browser fingerprint
- Logs completos de cada uso
- Ban automático se detectar VPN/proxy farming

**Ação Manual**:
```
Admin Panel > Coupons > [Code] > Suspicious Activity

Revisar:
- IPs repetidos
- Fingerprints similares
- Contas criadas recentemente

Ação:
- Banir usuários abusadores
- Invalidar usos fraudulentos (se necessário)
```

---

## 5. Gerenciamento de Withdrawals Manuais

### 5.1 Ver Withdrawals Pendentes

```
Admin Panel > Withdrawals > Pending Manual Processing

Lista:
ID      User        Item                        Hours Pending
-------------------------------------------------------------
W-1234  João        Legendary Sword             52h
W-1235  Maria       Epic Armor                  18h
W-1236  Pedro       Rare Pet                    3h
```

### 5.2 Processar Withdrawal Manual

```
Admin Panel > Withdrawals > [ID] > Process

1. Obter código do item:
   - Gerar novo código no HeroMart/AQW
   - OU usar código de estoque reservado

2. Inserir código:
   Code: AQWD-XXXX-XXXX-XXXX

3. Confirm > Process

Sistema:
- Envia código para o usuário (email + in-app)
- Marca withdrawal como 'completed'
- Atualiza inventário do usuário
- Registra ação no audit log
```

### 5.3 SLA (Service Level Agreement)

⏱️ **Tempo de Processamento**:
- Meta: < 24 horas
- Máximo: 72 horas (3 dias úteis)

**Priorização**:
1. Itens de alto valor primeiro
2. Withdrawals mais antigos
3. Usuários VIP/depositantes frequentes

---

## 6. Gerenciamento de Usuários

### 6.1 Visualizar Usuários

```
Admin Panel > Users

Filtros:
- Status: active, suspended, banned
- Role: user, moderator, admin
- Ordenar por: registros recentes, maior saldo, mais aberturas
```

### 6.2 Editar Usuário

```
Admin Panel > Users > [Username]

Ações Disponíveis:
- Ajustar saldo (adicionar/remover créditos)
- Alterar role (user ↔ moderator ↔ admin)
- Suspender conta (temporário)
- Banir conta (permanente)
- Ver histórico completo:
  • Depósitos
  • Aberturas
  • Withdrawals
  • Exchanges
  • Tickets
```

### 6.3 Adicionar Créditos Manualmente

```
Admin Panel > Users > [Username] > Add Credits

Valor: 50.00 USD
Motivo: "Compensation for system downtime"

Confirm > Add

NOTA: Ação registrada em audit log
```

### 6.4 Suspender/Banir Usuário

**Suspender (Temporário)**:
```
Motivo: Comportamento suspeito, investigação em andamento
Duração: 7 dias
```

**Banir (Permanente)**:
```
Motivo: Fraude confirmada, abuso de sistema, violação de ToS
IRREVERSÍVEL (usar com cautela)
```

---

## 7. Sistema de Tickets e Suporte

### 7.1 Dashboard de Tickets

```
Admin Panel > Support > Tickets

Status:
- Open: 12
- In Progress: 5
- Waiting User: 3
- Closed: 2,431

Prioridades:
- Urgent: 2
- High: 4
- Normal: 11
- Low: 3
```

### 7.2 Responder Ticket

```
Admin Panel > Support > Tickets > [ID]

Histórico da Conversa:
---
[User] 10:30 AM: My withdrawal is not working
[You]  10:35 AM: Hi! Can you provide the withdrawal ID?
[User] 10:37 AM: It's W-1234
---

Nova Mensagem:
"I've processed your withdrawal manually. Code: AQWD-XXXX-XXXX. Enjoy!"

[Send] [Close Ticket]
```

### 7.3 Escalar para Admin

Moderadores podem escalar tickets complexos:
```
Ticket > Escalate to Admin

Motivos comuns:
- Problema técnico
- Fraude suspeita
- Solicitação de reembolso
- Bug crítico
```

---

## 8. Monitoramento e Logs

### 8.1 Audit Logs

```
Admin Panel > Logs > Audit

Filtros:
- Ação: user_banned, credits_added, lootbox_created, etc.
- Admin: (quem fez a ação)
- Data: últimas 24h, 7d, 30d, custom

Exemplo:
Timestamp            Admin       Action              Details
--------------------------------------------------------------
2025-11-30 14:30     admin1      user_suspended      User: João, Reason: Abuse
2025-11-30 14:15     admin1      credits_added       User: Maria, Amount: 50.00
2025-11-30 13:45     admin2      lootbox_created     Name: Epic Box, Price: 10.00
```

### 8.2 Fairness Logs

```
Admin Panel > Logs > Fairness

Verificar distribuição:
- Últimas 24 horas
- Últimos 7 dias
- Últimos 30 dias

Alertas:
- Desvio > 5% da distribuição esperada
- Item ultra raro ganho múltiplas vezes por mesmo user
- Padrões anômalos
```

### 8.3 Transaction Logs

```
Admin Panel > Logs > Transactions

Tipos:
- Deposits (todos)
- Withdrawals (completed, pending, failed)
- Exchanges

Filtros por usuário, valor, data, status
```

---

## 9. Configurações do Sistema

### 9.1 Feature Flags

```
Admin Panel > Settings > Features

Toggles:
☑ Registration Enabled
☑ Deposits Enabled
☑ Withdrawals Enabled
☑ Exchanger Enabled
☐ Maintenance Mode

Saving changes reloads system configuration.
```

### 9.2 Exchange Fee

```
Current: 5% (0.05)

Admin Panel > Settings > Exchange Fee

New Value: 0.05 (5%)
```

### 9.3 Minimum Withdrawal Level

```
Current: 1

Admin Panel > Settings > Minimum Withdrawal Level

New Value: 3 (users must be level 3+ to withdraw)
```

---

## 10. Segurança e Boas Práticas

### 10.1 Proteção da Conta Admin

✅ **Recomendações**:
- Senha forte (16+ caracteres, mix de tipos)
- 2FA habilitado (Google Authenticator)
- Nunca compartilhar credenciais
- Logout sempre que terminar

### 10.2 Auditoria Regular

📅 **Mensal**:
- Revisar top 10 erros nos logs
- Verificar distribuição de fairness
- Revisar usuários suspensos/banidos
- Checar estoque de códigos

### 10.3 Rotação de Seeds

🔄 **Semanal (Automático)**:
- Cron job alerta para rotação de seed
- Gerar novo seed: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Atualizar `FAIRNESS_SECRET_SEED` em environment
- Reiniciar backend

### 10.4 Backup Verificado

💾 **Mensal**:
- Fazer restore de teste
- Verificar integridade dos dados
- Confirmar que backups funcionam

---

## 11. Troubleshooting Comum

### 11.1 "Withdrawal stuck in pending"

**Causa**: Sem códigos disponíveis

**Solução**:
1. Adicionar códigos ao estoque
2. Processar withdrawal manualmente

### 11.2 "User can't deposit"

**Causa**: Stripe/PayPal webhook não configurado

**Solução**:
1. Verificar webhooks no dashboard Stripe/PayPal
2. Confirmar endpoint: `/api/v1/webhooks/stripe`
3. Testar webhook

### 11.3 "Fairness verification failing"

**Causa**: Seed foi alterado/rotacionado

**Solução**:
- Verificações antigas usam seed antigo
- Normal após rotação de seed
- Documentar rotação no audit log

### 11.4 "High error rate on API"

**Causa**: Rate limiting ou servidor sobrecarregado

**Solução**:
1. Verificar logs de erro
2. Aumentar limites se legítimo
3. Escalar servidor se necessário

---

## 12. Contatos de Emergência

**Desenvolvimento**:
- Email: dev@aqw-skins.com
- Discord: [Server Link]

**Infraestrutura**:
- Database: Neon Support
- Backend: Render Support
- Frontend: Vercel Support

**Pagamentos**:
- Stripe: support@stripe.com
- PayPal: support@paypal.com

---

## Recursos Adicionais

- [Documentação de API](api.md)
- [Guia de Fairness](fairness.md)
- [Arquitetura do Sistema](architecture.md)
- [Guia de Deploy](deployment.md)

---

**Versão do Guia**: 1.0.0  
**Última Atualização**: 30/11/2025
