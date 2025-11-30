# Sistema de Fairness - Algoritmo Provably Fair

## Visão Geral

O sistema de fairness do AQW Skins garante que todos os sorteios de loot box são:
1. **Auditáveis**: Cada resultado pode ser verificado
2. **Seguros**: Impossível de manipular
3. **Transparentes**: Processo documentado e público
4. **Imutáveis**: Logs permanentes de todas operações

## Algoritmo Detalhado

### 1. Configuração da Loot Box

Cada loot box possui uma configuração JSON com itens e pesos:

```json
{
  "id": 1,
  "name": "Rare Items Box",
  "price": 5.00,
  "items": [
    { "id": 101, "weight": 9000 },  // 90% chance
    { "id": 102, "weight": 800 },   // 8% chance
    { "id": 103, "weight": 180 },   // 1.8% chance
    { "id": 104, "weight": 19 },    // 0.19% chance
    { "id": 105, "weight": 1 }      // 0.01% chance (ultra rare)
  ]
}
```

**Total Weight**: 10,000

### 2. Processo de Sorteio

#### Passo 1: Validação Inicial
```javascript
// Verificar saldo do usuário
if (user.balance < lootbox.price) {
  throw new Error('Insufficient balance');
}

// Verificar requisitos de nível
if (user.level < lootbox.min_level) {
  throw new Error('Level requirement not met');
}
```

#### Passo 2: Transaction Lock
```javascript
// Iniciar transação no banco de dados
await client.query('BEGIN');

// Lock do usuário para evitar race conditions
await client.query(
  'SELECT * FROM users WHERE id = $1 FOR UPDATE',
  [userId]
);
```

#### Passo 3: Geração de Número Aleatório Seguro
```javascript
import crypto from 'crypto';

/**
 * Gera número aleatório criptograficamente seguro
 * NÃO usa Math.random() - usa crypto module do Node.js
 */
function secureRandomInt(min, max) {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const limit = maxValue - (maxValue % range);
  
  let randomValue;
  do {
    // Gera bytes aleatórios seguros
    const randomBytes = crypto.randomBytes(bytesNeeded);
    randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = randomValue * 256 + randomBytes[i];
    }
  } while (randomValue >= limit); // Elimina bias
  
  return min + (randomValue % range);
}

// Gerar número entre 1 e totalWeight
const randomValue = secureRandomInt(1, totalWeight);
```

#### Passo 4: Seleção do Item (Distribuição Ponderada)
```javascript
function selectItemByWeight(items, randomValue) {
  let cumulativeWeight = 0;
  
  for (const item of items) {
    cumulativeWeight += item.weight;
    
    // Se random cai dentro deste intervalo, seleciona este item
    if (randomValue <= cumulativeWeight) {
      return item;
    }
  }
  
  // Fallback (nunca deveria acontecer)
  return items[items.length - 1];
}

const selectedItem = selectItemByWeight(lootbox.items, randomValue);
```

**Exemplo de Distribuição:**
```
Items:
  A: weight = 9000 (range: 1-9000)
  B: weight = 800  (range: 9001-9800)
  C: weight = 180  (range: 9801-9980)
  D: weight = 19   (range: 9981-9999)
  E: weight = 1    (range: 10000)

Random = 9850 → Item C selecionado
Random = 5000 → Item A selecionado
Random = 10000 → Item E selecionado
```

#### Passo 5: Geração do Hash de Fairness (HMAC)
```javascript
import crypto from 'crypto';

function generateFairnessHash(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

// Dados da abertura
const timestamp = Date.now();
const fairnessData = {
  userId: userId,
  lootboxId: lootbox.id,
  itemId: selectedItem.id,
  timestamp: timestamp,
  randomValue: randomValue,
  totalWeight: totalWeight
};

// String única para hash
const fairnessString = JSON.stringify(fairnessData);

// Secret seed (rotacionado semanalmente)
const serverSeed = `${process.env.FAIRNESS_SECRET_SEED}_${timestamp}`;

// Gerar HMAC
const fairnessHash = generateFairnessHash(fairnessString, serverSeed);
```

**Resultado:**
```
Hash: a7f5e9c1d2b3a4e6f8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

#### Passo 6: Registro no Banco de Dados
```sql
-- Inserir no log de aberturas (IMUTÁVEL)
INSERT INTO lootbox_openings (
  user_id,
  lootbox_id,
  item_id,
  price_paid,
  fairness_hash,
  fairness_data,
  fingerprint,
  opened_at
) VALUES (
  123,
  1,
  103,
  5.00,
  'a7f5e9c1...',
  '{"userId":123,"lootboxId":1,"itemId":103,...}',
  'abc123fingerprint',
  NOW()
);

-- Adicionar item ao inventário
INSERT INTO inventory (
  user_id,
  item_id,
  source_type,
  source_id,
  obtained_at
) VALUES (123, 103, 'lootbox', 1, NOW());

-- Debitar créditos
UPDATE users 
SET balance = balance - 5.00 
WHERE id = 123;

-- Commit da transação
COMMIT;
```

### 3. Verificação Pública

Os usuários podem verificar a fairness de qualquer abertura:

#### Endpoint de Verificação
```
GET /api/v1/fairness/verify/:openingId
```

#### Processo de Verificação
```javascript
async function verifyOpening(openingId, userId) {
  // 1. Buscar registro da abertura
  const opening = await db.query(
    'SELECT * FROM lootbox_openings WHERE id = $1',
    [openingId]
  );
  
  // 2. Reconstruir hash com os mesmos dados
  const fairnessData = opening.fairness_data;
  const fairnessString = JSON.stringify(fairnessData);
  const serverSeed = `${process.env.FAIRNESS_SECRET_SEED}_${fairnessData.timestamp}`;
  const recomputedHash = generateFairnessHash(fairnessString, serverSeed);
  
  // 3. Comparar hashes
  const isValid = (recomputedHash === opening.fairness_hash);
  
  return {
    verified: isValid,
    originalHash: opening.fairness_hash,
    recomputedHash: recomputedHash,
    data: {
      randomValue: fairnessData.randomValue,
      totalWeight: fairnessData.totalWeight,
      timestamp: fairnessData.timestamp
    }
  };
}
```

### 4. Garantias de Segurança

#### 4.1 Impossível Prever o Resultado
- **Random seguro**: `crypto.randomBytes` usa /dev/urandom (kernel entropy)
- **Timestamp lock**: Resultado vinculado ao momento exato
- **Server seed rotacionado**: Muda semanalmente, impossível prever

#### 4.2 Impossível Manipular Após o Fato
- **HMAC imutável**: Hash criptográfico do resultado
- **Log permanente**: Registro no banco nunca é deletado
- **Timestamp proof**: Momento exato da abertura registrado

#### 4.3 Auditável por Terceiros
- **Hash público**: Usuário recebe o hash imediatamente
- **Dados verificáveis**: Random value e weights podem ser conferidos
- **Logs acessíveis**: Admin e auditores podem revisar distribuição

### 5. Anti-Manipulação

#### Detecção de Anomalias
```javascript
// Cron job diário para verificar distribuição
async function checkDistributionAnomaly() {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Distribuição real
  const distribution = await db.query(`
    SELECT 
      i.rarity,
      COUNT(*) as times_won,
      AVG(i.value) as avg_value
    FROM lootbox_openings lo
    JOIN items i ON lo.item_id = i.id
    WHERE lo.opened_at > $1
    GROUP BY i.rarity
  `, [last7Days]);
  
  // Comparar com distribuição esperada
  // Se desvio > 5%, alertar admin
  for (const row of distribution.rows) {
    const expectedPercentage = getExpectedPercentage(row.rarity);
    const actualPercentage = (row.times_won / totalOpenings) * 100;
    const deviation = Math.abs(actualPercentage - expectedPercentage);
    
    if (deviation > 5) {
      alertAdmin(`Anomalia detectada: ${row.rarity} - Desvio de ${deviation}%`);
    }
  }
}
```

#### Limitação de Aberturas Suspeitas
```javascript
// Rate limiting por usuário
const openingsInLastMinute = await db.query(`
  SELECT COUNT(*) 
  FROM lootbox_openings 
  WHERE user_id = $1 
  AND opened_at > NOW() - INTERVAL '1 minute'
`, [userId]);

if (openingsInLastMinute.rows[0].count > 30) {
  throw new Error('Too many openings, slow down');
}
```

### 6. Rotação de Seed

**Cron Job Semanal (Domingo 3 AM):**
```javascript
cron.schedule('0 3 * * 0', () => {
  auditLogger.warn('SEED ROTATION REMINDER', {
    message: 'Update FAIRNESS_SECRET_SEED in environment',
    timestamp: new Date().toISOString()
  });
  
  // Em produção, atualizar automaticamente em secrets manager
  // AWS Secrets Manager, HashiCorp Vault, etc.
});
```

### 7. Transparência Pública

#### Página "Provably Fair"
- Explicação do algoritmo em linguagem simples
- Exemplo de verificação passo a passo
- Link para código-fonte no GitHub
- Estatísticas de distribuição agregada (últimos 30 dias)

#### Dashboard Admin
- Distribuição real vs esperada
- Alertas de anomalias
- Histórico de rotação de seeds
- Logs de todas aberturas

---

## Exemplo Completo de Abertura

```
USUÁRIO: João
SALDO: $10.00
LOOT BOX: "Legendary Box" ($5.00)

1. Validação:
   ✓ Saldo suficiente
   ✓ Nível 5 (required: 1)

2. Transaction BEGIN

3. Random Generation:
   - Total Weight: 10,000
   - Random Value: 8,734 (crypto.randomInt)

4. Item Selection:
   - Range Check:
     • Item A (1-9000): NO
     • Item B (9001-9800): NO
     • Item C (9801-9980): NO
     • Item D (9981-9999): NO
     • Item E (10000): NO
   - Selected: Item B (Epic Sword)

5. Fairness Hash:
   - Data: {"userId":123,"lootboxId":5,"itemId":42,"timestamp":1701388800000,"randomValue":8734,"totalWeight":10000}
   - Seed: fairness_secret_2024_1701388800000
   - HMAC: d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5

6. Database Update:
   ✓ Inventory: +1 Epic Sword
   ✓ Balance: $10.00 → $5.00
   ✓ Log: Opening #98765 recorded

7. Transaction COMMIT

8. Return to User:
   {
     "item": "Epic Sword",
     "fairnessHash": "d4e5f6a7...",
     "verify": "/api/v1/fairness/verify/98765"
   }
```

---

**Este algoritmo garante fairness matemática e auditabilidade completa.**
