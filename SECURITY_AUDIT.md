# Relatório de Auditoria de Segurança
**Data da Auditoria:** 17/04/2026
**Agente Responsável:** `security-auditor`
**Framework de Referência:** OWASP Top 10:2025

Este documento registra as vulnerabilidades e padrões de risco identificados durante a varredura automática (`security_scan.py`) em conjunto com a análise técnica preditiva, bem como as devidas mitigações arquiteturais e de código aplicadas no sistema Dashboard Suzano.

---

## 1. Vulnerabilidade Crítica: Injeção de SQL (OWASP A05)
**Nível de Ameaça:** Crítico 🔴
**Arquivo:** `backend/api/data.py` (Linhas afetadas: 189, 235-252)
**Vetor:** O parâmetro opcional da query URL `sort_by` não possuía nenhum filtro de entrada de dados no Endpoint Paginado de Inconsistências. Este valor estava sendo formatado diretamente (via f-string/interpolação e `text()`) como coluna da cláusula `ORDER BY` da consulta principal no SQL.
**Risco:** Um atacante poderia preencher algo malicioso como `?sort_by=id; DROP TABLE usuarios;--` abrindo uma exploração profunda da base via injeção lateral no PostgreSQL.

### Solução Aplicada:
- Implementado um padrão de _Fail Secure_ (Tratamento rigoroso de erro em fallback).
- Adicionada uma validação expressa baseada em Expressão Regular (`Regex` restritiva: `^[a-zA-Z0-9_]+$`) logo na chegada do input em `backend/api/data.py`.
- Se o parâmetro portar formatações suspeitas (vírgulas, aspas, ponto-vírgula), a API instantaneamente retorna o status genérico **400 Bad Request** (`Parâmetro de ordenação inválido`) antes de atingir o compilador SQL.

---

## 2. Vulnerabilidade Crítica: Vazamento de Credenciais (OWASP A04)
**Nível de Ameaça:** Crítico 🔴
**Arquivo:** `backend/scripts/setup_admin.py` (Linha afetada: 14/15)
**Vetor:** O uso de credenciais e senhas atadas abertamente na fonte de geração de dados no formato de _Hardcoded Password_ (`admin123`).
**Risco:** O envenenamento e acesso massivo por atacantes à base via vazamento de informações expostas no código ou via logs do repositório/versionamento de rotinas.

### Solução Aplicada:
- Refatorado o contâiner em Python utilizando o pacote global `os`.
- A senha administrativa (`admin123`) foi inteiramente expurgada do texto e agora passa a ser interpretada obrigatoriamente através da variável base de ambiente: `os.environ.get("ADMIN_INITIAL_PASSWORD")`.
- A execução do setup paralisa em exceção restrita explícita caso não haja formatação desta variável do sistema, blindando tentativas de provisionamentos de rede inseguros no pipeline ou na máquina do desenvolvedor.

---

## 3. Vulnerabilidade Média: Má Configuração e Ausência de Cabeçalhos (OWASP A02)
**Nível de Ameaça:** Médio 🟡
**Arquivo:** `backend/main.py`
**Vetor:** O servidor FastAPI não detinha injeção dos "HTTP Security Headers" essenciais na devolução dos corpos web, deixando a camada desfortificada base.
**Risco:** Brecha para Sniffing HTTP, Clickjacking avançado baseado na alocação da porta web em IFrames externos (X-Frame) ou ataques remotos de roteamento inseguro de transporte SSL sem HSTS.

### Solução Aplicada:
- Adicionado um **Midlleware Assíncrono Restritivo** Global no Core principal da base.
- Todos os "Responses" intercedidos pelo Backend (seja erro ou payload) obrigatoriamente despacham a assinatura:
  - `X-Content-Type-Options: nosniff` (Mitiga MIME-Sniffing)
  - `X-Frame-Options: DENY` (Proíbe render em IFrames externos - Clickjacking)
  - `X-XSS-Protection: 1; mode=block` (Proteção de injeção direta de JS Web via navegador)
  - `Strict-Transport-Security: max-age=31536000` (HSTS - Obriga túnel https inquebrável para as conexões).

---

## Notas de Falsos-Positivos Catalogados
Houve o alerta de escâner em dois módulos relativos ao conceito `Bearer Token`. Mediante a leitura algorítmica, atestou-se por falso-positivo pois a tag `oauth2_scheme = OAuth2PasswordBearer` se refere exclusivamente a sintaxe do framework de rotas (FastAPI Authentication), não alocando ou configurando senhas criptográficas abertas localmente.

---

## Refinamento Defensivo Fase 2: Análise Manual Estrutural (White/Gray Box)

Dando sequência aos alinhamentos de segurança defensiva propostos no momento inicial, realizei uma aprofundada varredura humana simulando um invasor observando as cadeias de autenticação e containers orquestrados. Apliquei mais três camadas de restrição avançada no ambiente:

### 4. Vulnerabilidade Crítica: Vazamento de Informações Sensíveis em Resposta HTTP (OWASP A01 / A07)
**Nível de Ameaça:** Crítico 🔴
**Arquivo:** `backend/api/auth.py`
**Vetor:** Identificado que, ao acionar uma redefinição ou aprovação de senha pelos métodos REST `approve_user` e `reset_password`, além de disparar o e-mail transacional (seguro) o sistema também retornava a **senha estruturada em tempo real na raiz do corpo JSON via web** (`"temporary_password": temp_pwd`). 
**Risco:** Viola os princípios de `Zero-Trust`. Um administrador ou um *Sniffing* de rede observando logs trafegados pela camada HTTP decaptaria passivamente a senha limpa de milhares de colaboradores, habilitando os *Ties* perigosos de contas de acesso (Account Takeover).
**Solução Aplicada:** 
- Toda indexação ou devolução da variável `temporary_password` no objeto retornado ao front-end ou Pydantic Schema foi suprimida. A senha passará restritamente ao provedor de Email seguro.

### 5. Vulnerabilidade Alta: Sessão de Longa Duração Insegura (OWASP A07)
**Nível de Ameaça:** Alto 🟠
**Arquivo:** `backend/core/security.py`
**Vetor:** O Token de acesso principal (Bearer JWT) possuía o limite base contínuo amarrado em `60 * 24` (24 horas).
**Risco:** Se o dispositivo de um usuário for comprometido, ou a estampa local for roubada (XSS / Physical access), o token permanece validado e perfeitamente injetável na arquitetura para simular as próximas operações até o esgotamento fatal de um dia inteiro (Session Hijacking).
**Solução Aplicada:**
- A validade intrínseca decresceu para restritos **60 Minutos**. Obrigando um Re-handshake constante na arquitetura, achatando gravemente a janela de tempo dos intrusos.

### 6. Vulnerabilidade Média: Elevação de Privilégio no Contêiner (Docker Antipattern)
**Nível de Ameaça:** Médio 🟡
**Arquivo:** `backend/Dockerfile`
**Vetor:** A orquestração base omitia o espelhamento de qual *User Group* executava as operações dos micro frameworks do python. Implicitamente, ao ser inicializado pela Docker Engine, o servidor detinha acessos escalonados por `Root` isolado.
**Risco:** Caso a brecha por _Remote Code Execution (RCE)_ fosse estourada por injeções de terceiros, o controle nativo do atacante seria do usuário super-administrador, transpondo as chances de escapar do perímetro da Virtualização em direção ao Host base.
**Solução Aplicada:**
- Definida a instrução compulsória de `groupadd` no processo formador da imagem de produção Docker.
- Criado o usuário abstrato de menor privilégio (`appuser:appuser`), que torna-se o restrito *Owner* absoluto do sistema, blindando *Host Escape*.

*Documento auditado com sucesso através da metodologia Defensive Red-Team – Zero Trust Architecture Review.*
