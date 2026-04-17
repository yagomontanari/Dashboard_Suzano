# Plano de Orquestração: Remediação de Segurança Suzano

**Versão:** 1.0
**Status:** Aprovado ✅
**Orquestrador:** Antigravity

---

## 📋 Objetivos
Corrigir as vulnerabilidades críticas e médias identificadas no pentest, focando em:
1.  Eliminação total de SQL Dinâmico (f-strings) em favor de `bind parameters`.
2.  Implementação de Rate Limiting (60 req/min por IP).
3.  Fortalecimento de Cabeçalhos de Segurança (CSP).
4.  Sanitização de logs e respostas de erro da API.

---

## 🎼 Matriz de Especialistas e Tarefas

### 1. `backend-specialist` (Core & Infra)
- **SQL Parametrization**: Refatorar `backend/api/data.py` para usar parâmetros nomeados do SQLAlchemy em TODAS as execuções de texto, removendo f-strings.
- **Rate Limiting**: Adicionar `slowapi` ou middleware customizado de limite de taxa nas rotas do `router`.

### 2. `security-auditor` (Hardenization)
- **CSP Headers**: Adicionar políticas de CSP estritas em `backend/main.py`.
- **Error Sanitization**: Remover `traceback` das respostas JSON e garantir que erros internos retornem mensagens genéricas amigáveis.

### 3. `test-engineer` (Validação)
- **Security Tests**: Criar script em `backend/tests/test_security_remediation.py` para validar:
    - Rejeição de injeção SQL.
    - Bloqueio por excesso de requisições.
    - Presença de cabeçalhos de segurança.

---

## 🛠️ Cronograma de Execução

1.  **Prep**: Atualização do `backend/requirements.txt` com as dependências necessárias (ex: `slowapi`).
2.  **Code Fixes**: Execução paralela das tarefas dos especialistas.
3.  **Verification**: Execução dos testes e scan final de segurança.

---
*Assinado: Project Planner Agent*
