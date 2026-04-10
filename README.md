# Dashboard Suzano

Este é o repositório principal do projeto contendo o **Backend (FastAPI)** e o **Frontend (React/Vite)**. Todo o sistema é projetado para rodar exclusivamente via Docker, simplificando ambientes locais e produção.

## 🚀 Como Executar o Projeto

O projeto inteiro (Front e Back) é orquestrado através do Docker Compose, sem necessidade de se instalar as dependências de NodeJS ou Python localmente.

### 1. Configurando as Variáveis de Ambiente

Antes de subir a aplicação, crie as configurações de banco de dados para a API:

```bash
# Entre na pasta backend
cd backend

# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e coloque os dados do seu PostgreSQL
# Formato padrão: postgresql+asyncpg://usuario:senha@host:porta/banco
```
*Dica para Host: Se o seu PostgreSQL roda diretamente na sua máquina host (Linux), e não no Docker, você pode usar o IP da rede local da máquina (ex: `192.168.1.X`) no `host` da connection string.*

### 2. Subindo com Docker Compose

Retorne à raiz do projeto e execute a build das imagens e criação dos containers:

```bash
# Na raiz do projeto (/AgenteSuzano)
docker compose up --build -d
```

### 3. Acessando a Aplicação
Após o deploy feito pelo comando acima, os serviços estarão disponíveis nas portas a seguir:

- **Frontend (Painel)**: [http://localhost:3001](http://localhost:3001)
- **Backend (API)**: [http://localhost:8001](http://localhost:8001)
- **Dozzle (Logs Web)**: [http://localhost:8889](http://localhost:8889)

---

## 📝 Implementações Realizadas (Changelog)

> *NOTA: Este histórico deve ser atualizado **sempre que desenvolvermos uma nova feature** para manter o rastreio da evolução do projeto.*

### [17-03-2026]
- **Otimização do Dashboard**: Reconstrução total da lógica de contagem de inconsistências. Substituímos o processamento em memória por subconsultas SQL `COUNT(1)` diretas no PostgreSQL, permitindo que o painel carregue instantaneamente mesmo com grandes volumes de dados (ex: >8.000 registros de Sellin).
- **Inconsistências (Nova Categoria)**: Adicionada a categoria **Pagamentos** ao fluxo de inconsistências, com suporte completo a visualização no dashboard e detalhamento no modal.
- **Modal de Detalhes & Paginação**: Implementada a visualização detalhada de inconsistências via Modal com paginação real (limite de 20 registros por vez), otimizando o consumo de rede e a performance do navegador.
- **Exportação Excel**: Refatorada a função de exportação para garantir que a ordem das colunas, os nomes dos cabeçalhos e os dados formatados nos arquivos Excel sejam idênticos aos exibidos na interface do usuário.
- **Filtros Temporais Inteligentes**: Implementada lógica de data dinâmica que filtra automaticamente o dashboard para o **mês vigente**, garantindo métricas sempre atualizadas e relevantes.
- **Segurança (Hardening)**: Removidas credenciais de exemplo das mensagens de erro na tela de login para evitar exposição acidental de senhas e aumentar a segurança do sistema.
- **Correções Técnicas**: Resolvidos problemas de tipagem de dados (`DatatypeMismatchError`) e erros de sintaxe SQL (`PostgresSyntaxError`) que afetavam a estabilidade das consultas assíncronas no backend.
- **Documentação & Docker**: Documentação centralizada (`README.md`) contendo passo a passo de como rodar o projeto e o changelog. Configurado carregamento de `.env` via `pydantic-settings` e orquestração completa via Docker Compose.
