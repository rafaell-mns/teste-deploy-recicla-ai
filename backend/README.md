# ♻️ Banco de Dados para Iteração II do Recicla Aí
O sistema representa o fluxo completo da coleta seletiva:
1. **Produtores** registram solicitações de coleta.  
2. **Coletores** aceitam e realizam essas coletas.  
3. **Itens de solicitação** especificam os resíduos enviados.  
4. **Recompensas** são concedidas conforme o desempenho do produtor.  
5. **Cooperativas** gerenciam e agrupam coletores.

---

## 🗂️ Tabelas do Sistema

### 🧍 produtor
Armazena informações de quem gera os resíduos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer | Identificador único |
| nome | varchar(100) | Nome do produtor |
| email | varchar(100) | E-mail de acesso |
| senha | varchar(255) | Senha criptografada |
| telefone | varchar(20) | Telefone de contato |
| cpf_cnpj | varchar(18) | CPF ou CNPJ do produtor |
| cep | varchar(9) | CEP |
| rua | varchar(150) | Logradouro |
| numero | varchar(10) | Número do endereço |
| bairro | varchar(100) | Bairro |
| cidade | varchar(100) | Cidade |
| estado | char(2) | Estado |
| geom | geometry(Point, 4326) | Localização geográfica |
| nota_avaliacao_atual | numeric(3,2) | Média das avaliações |
| total_avaliacoes | integer | Total de avaliações recebidas |
| saldo_pontos | numeric(10,2) | Pontos acumulados para recompensas |

---

### 🚛 coletor
Representa o responsável pela coleta dos resíduos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer | Identificador único |
| nome | varchar(100) | Nome do coletor |
| email | varchar(100) | E-mail |
| senha | varchar(255) | Senha criptografada |
| telefone | varchar(20) | Telefone |
| cpf | varchar(14) | CPF |
| cep | varchar(9) | CEP |
| cidade | varchar(100) | Cidade |
| estado | char(2) | Estado |
| geom | geometry(Point, 4326) | Localização atual |
| nota_avaliacao_atual | numeric(3,2) | Média de avaliações recebidas |
| total_avaliacoes | integer | Quantidade total de avaliações |

---

### 🏢 cooperativa
Tabela com dados de cooperativas parceiras.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer | Identificador único |
| nome_empresa | varchar(150) | Nome da cooperativa |
| email | varchar(100) | E-mail |
| senha | varchar(255) | Senha criptografada |
| telefone | varchar(20) | Telefone |
| cnpj | varchar(18) | CNPJ |
| cep | varchar(9) | CEP |
| rua | varchar(150) | Rua |
| numero | varchar(10) | Número |
| bairro | varchar(100) | Bairro |
| cidade | varchar(100) | Cidade |
| estado | char(2) | Estado |
| geom | geometry(Point, 4326) | Localização geográfica |

---

### 🧾 solicitacao_coleta
Representa cada pedido de coleta feito por um produtor.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | integer | Identificador da solicitação |
| produtor_id | integer | FK → produtor.id |
| coletor_id | integer | FK → coletor.id |
| status | varchar(20) | Situação da coleta (`SOLICITADA`, `ACEITA`, `CANCELADA`, `CONFIRMADA`) |
| inicio_coleta | timestamp | Data/hora inicial |
| fim_coleta | timestamp | Data/hora final |
| observacoes | varchar(200) | Observações do pedido |

---

### 🧱 item_solicitacao
Itens que compõem cada solicitação de coleta.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id_item | integer | Identificador do item |
| id_solicitacao | integer | FK → solicitacao_coleta.id |
| quantidade | numeric(10,2) | Quantidade do resíduo |
| tipo_residuo | varchar(50) | Tipo do material (`Vidro`, `Metal`, `Papel`, `Plástico`) |
| unidade_medida | varchar(10) | Unidade (`KG`, `UN`, `VOLUME`) |

---

### 🎁 recompensa
Tabela de recompensas disponíveis ou resgatadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id_recompensa | integer | Identificador único |
| id_produtor | integer | FK → produtor.id |
| codigo_voucher | varchar(50) | Código do voucher |
| nome_premio | varchar(100) | Nome do prêmio |
| loja_parceira | varchar(100) | Estabelecimento parceiro |
| status | varchar(20) | Estado da recompensa (`ATIVO`, `RESGATADO`) |

---

## 🔗 Relacionamentos

- **produtor (1) — (N) solicitacao_coleta**  
  Um produtor pode fazer várias solicitações.

- **coletor (1) — (N) solicitacao_coleta**  
  Um coletor pode atender várias solicitações.

- **solicitacao_coleta (1) — (N) item_solicitacao**  
  Cada solicitação pode ter vários tipos de resíduos.

- **produtor (1) — (N) recompensa**  
  Cada produtor pode possuir múltiplas recompensas.

