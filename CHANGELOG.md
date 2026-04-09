# Changelog - Dashboard Suzano

Todas as alterações notáveis neste projeto serão documentadas neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) e este projeto segue a [Semântica de Versionamento](https://semver.org/spec/v2.0.0.html).

---

## [1.6.2] - 2026-04-09
### Alterado
- **Personalização Estética de E-mail**:
  - Novo design system aplicado aos e-mails (Paleta Slate/Blue).
  - Inclusão de logos da Suzano, Tradelinks e Magalu Cloud (Powered by).
  - Configuração de `FRONTEND_URL` para suporte a imagens e links absolutos.

---

## [1.6.1] - 2026-04-09
### Corrigido
- **Acesso (Frontend)**: Restaurado import do `useState` em `Login.jsx` que impedia o carregamento da tela inicial.
- **Fluxo de E-mail**: Removido disparo redundante de e-mail de "Aguardando Aprovação" no cadastro (conforme solicitado).

---

## [1.6.0] - 2026-04-09
### Adicionado
- **Integração de E-mail (SMTP Gmail)**:
  - Implementação do serviço `MailService` com suporte a envio assíncrono via Gmail.
  - Criação de templates HTML customizados (Azul/Verde Suzano) para Boas-vindas, Aprovação e Reset de Senha.
- **Recuperação de Senha (Autoatendimento)**:
  - Novo endpoint `/api/auth/forgot-password` para usuários solicitarem nova senha de forma autônoma.
  - Modal "Esqueci minha senha" integrado à tela de login com feedback em tempo real.
- **Automação de Credenciais**:
  - Envio automático de senhas temporárias por e-mail no momento da aprovação pelo administrador.

---

## [1.5.0] - 2026-04-09
### Adicionado
- **Otimização de Performance (Backend)**:
  - Implementação de paralelismo total (`asyncio.gather`) no endpoint do dashboard, permitindo que todas as métricas sejam consultadas simultaneamente no PostgreSQL.
  - Agregação SQL Direta: Substituição do processamento de soma/contagem no Python por funções agregadas (`SUM`, `COUNT`) diretamente no banco de dados.
- **Melhorias de UX (Frontend)**:
  - **Skeleton Screens**: Substituição do spinner de bloqueio por placeholders animados que mantêm a estrutura visual do site durante o carregamento.
  - **Otimização de Render**: Implementação de `useMemo` para reduzir re-renderizações desnecessárias em gráficos e tabelas pesadas.

---

## [1.4.0] - 2026-04-09
### Adicionado
- **Políticas de Segurança Críticas**:
  - Bloqueio automático de conta (Lockout) após 5 tentativas de login incorretas por 1 hora.
  - Expiração obrigatória de senha a cada 90 dias.
  - Histórico de senhas: Proibição de reutilização das últimas 12 senhas utilizadas.
- **UX de Senha**: Componente de checklist em tempo real com validação dinâmica de complexidade (Regex).
- **Gestão Admin**: Botão de desbloqueio manual de usuários bloqueados por segurança.

---

## [1.3.0] - 2026-04-09
### Adicionado
- **Gestão de Usuários Completa**:
  - Edição de Nome, E-mail e Perfil (Role) por Administradores.
  - Controle de Status: Ativar/Inativar contas manualmente.
  - Reset de Senha Administrativo com geração de senha temporária.
- **Segurança**: Trava de segurança para impedir a auto-inativação de administradores.

### Corrigido
- Ajuste de roteamento no Vercel (remoção de prefixo redundante `/api`) que causava erro 404 no login.

---

## [1.2.0] - 2026-04-09
### Adicionado
- **Sistema de Autenticação Persistente (Supabase)**:
  - Migração do sistema de usuários mockados para banco de dados real no Supabase.
  - Fluxo de Registro: Novas solicitações entram com status `PENDENTE`.
  - Controle de Acesso Baseado em Perfil (RBAC): Perfis `ADMIN` e `CONSULTA`.
  - Proteção de rotas no Frontend e Backend.
- **Troca de Senha Obrigatória**: Força o usuário a definir uma senha definitiva no primeiro acesso.

---

## [1.1.0] - 2026-04-09
### Adicionado
- **Arquitetura de Banco Duplo**:
  - Separação entre o banco de Métricas Suzano (`db_tradelinks` - Read-Only) e o banco de Aplicação (Supabase - Read/Write).
- **Estrutura Backend**: Integração com SQLAlchemy Async e Pydantic para validação de dados.

---

## [1.0.0] - 2026-03-20
### Adicionado
- **Dashboard Suzano MVP**:
  - Implementação das métricas de Sell-In, Sell-Out e Positivação.
  - Integração com o banco de dados PostgreSQL Suzano.
  - Layout Suzano Premium (Dark Mode, Grades Modernas).
  - Componentização visual com Lucide React.

---
*Atualizado em: 09 de Abril de 2026 por Antigravity AI.*
