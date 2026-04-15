# Bug Log - Dashboard Suzano

Este arquivo registra todos os bugs identificados e tratados, servindo como histórico técnico e base de conhecimento.

## Resumo de Status
- **Bugs Resolvidos:** 7
- **Bugs Críticos Atuais:** 0
- **Monitoramento:** Ativo

---

### [BUG-006] SyntaxError em data.py (unmatched ')')
- **Sintoma:** Backend falhava ao iniciar na Vercel com erro 500: `SyntaxError: unmatched ')'`.
- **Causa:** Erro durante a implementação do endpoint de exportação detalhada de clientes, onde um bloco `StreamingResponse` foi fechado incorretamente e parâmetros essenciais (`headers`) foram removidos acidentalmente.
- **Solução:** Corrigida a estrutura do `StreamingResponse` e restaurado o parâmetro `headers` com a configuração de `Content-Disposition`.
- **Status:** ✅ Resolvido

---

### [BUG-005] Erro de Tipagem asyncpg no Relatório de Saldos
- **Sintoma:** Falha na exportação de Saldos com erro `DataError: invalid input for query argument $1 (expected datetime, got str)`.
- **Causa:** O driver `asyncpg` exige objetos `datetime.datetime` nativos do Python para parâmetros de data, mas o código estava passando strings formatadas via `.strftime()`.
- **Solução:** Removida a conversão para string, passando os objetos `datetime` diretamente na execução da query.
- **Status:** ✅ Resolvido

---

## 2026-04-13

- **Sintoma:** O dashboard parava de responder e exibia um alerta de erro de rede em todas as exportações.
- **Causa:** Referência a uma variável de estado `dateRange` que não existia no componente `Dashboard.jsx`.
- **Solução:** Implementado o estado `dateRange` no componente, configurado com o período do mês atual por padrão, e sincronizada a passagem desse parâmetro para todos os serviços de API (Dashboard, VK11 e Inconsistências).
- **Status:** ✅ Resolvido

### [BUG-003] SyntaxError no Deploy: `process exited with exit status: 1`
- **Sintoma:** O backend falhava ao iniciar na Vercel com erro `SyntaxError: '[' was never closed`.
- **Causa:** Erro de edição manual que removeu o fechamento de uma lista e algumas colunas em `data.py`.
- **Solução:** Restaurada a sintaxe correta e a lista de colunas completa.
- **Status:** ✅ Resolvido

### [BUG-002] Erro de Casting SQL (Integer Overflow)
- **Sintoma:** Exportação detalhada falhava sem gerar logs claros quando atingia determinados registros.
- **Causa:** Uso de `CAST(... AS INTEGER)` para números de documentos. Alguns documentos Suzano superam 2.1 bilhões (limite do `INT32`).
- **Solução:** Alterado o cast para `BIGINT` em todas as queries de Sell-In.
- **Status:** ✅ Resolvido

### [BUG-001] Falha de Formatação de Data (Regex mismatch)
- **Sintoma:** O modal exibia `00:00:00` fixo no campo de data e a exportação detalhada falhava por inconsistência de dados.
- **Causa:** O Regex no SQL esperava hífens (`-`), mas os dados reais continham barras (`/`) e timestamps sufixados.
- **Solução:** Implementado Regex robusto `[0-9]{2,4}[-/][0-9]{2}[-/][0-9]{2,4}` que suporta ambos os separadores e limpa o timestamp residual.
- **Status:** ✅ Resolvido
