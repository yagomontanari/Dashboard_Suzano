# Changelog - Dashboard Suzano

Todas as alterações notáveis neste projeto serão documentadas neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) e este projeto segue a [Semântica de Versionamento](https://semver.org/spec/v2.0.0.html).

---

## [1.8.1] - 2026-04-10
### Adicionado
- **Exportação ZAJU (E-mail)**:
  - Novo parser automatizado que extrai e decodifica o mês e ano de referência diretamente do arquivo gerado (ex: `Março/2026`) para exibição descritiva no corpo do e-mail.
- **Exportação ZAJU (Planilhas e Abas)**:
  - Divisão dinâmica do relatório de ZAJU por abas no Excel (`Verbas de Contrato` e `Promo & Ações`) dependendo dos subtipos dos IDs informados na query.
  - Estilização corporativa aplicada nas colunas do cabeçalho de planilhas exportadas através da injeção do UI `openpyxl`.
### Alterado
- **Exportação ZAJU (Formatação BRL e Percentuais)**:
  - Renomeada e remapeada renderização final da métrica base `% Verba Bruto` para o escopo lógico solicitado como `Provisão % SAP`.
  - Tratativa das máscaras financeiras: Conversão das tipagens de Ponto Flutuantes (`.`) nos Dataframes do Backend para Strings de notação regionalizadas (`1.000,00`) para colunas monetárias e atrelamento contextual `%` em campos percentuais (ex: `15,30%`).
- **Design de E-mail (UI/UX)**:
  - Largura do modal central dos avisos por e-mail unificada e expandida (de 550px para 700px), conferindo maior espaço e conforto na leitura.
- **Modernização do Dashboard (UI/UX)**:
  - Implementação de gráficos de rosca (`Donut Charts`) para monitoramento de saúde de integração, com aumento de escala (raio maior) para melhor visualização.
  - Visão detalhada por cartão: centralização do valor "TOTAL" e legenda lateral com contagem e percentual dinâmico.
  - Tradução e padronização das legendas para o padrão BRL: `Sucesso`, `Pendente` e `Erro`.
  - Otimização do Grid Layout: Refinamento da proporção da tela principal para **60% Integrações** vs **40% Inconsistências de Cadastro** (Grid-10), com as integrações agora distribuídas em 3 colunas iguais.
  - Implementação do **Log de Integrações**: Seção dedicada para monitoramento em tempo real do tráfego de dados entre SAP e Tradelinks.
    - Captura de **Dados de Entrada (Inbound)**: Via `integracao_requisicao`, incluindo rastreabilidade por número de **Lote**.
    - Captura de **Dados de Saída (Outbound)**: Via `suzano_integracao_servico` para monitoramento de envios ao SAP (ZVER, VK11, ZAJU).
    - Interface refinada com selos direcionais aumentados (`↑ TL -> SAP` / `↓ SAP -> TL`), inclusão de data completa (`DD/MM`) e iconografia especializada para cada processo (Logística, Financeiro, Cadastro).
  - Melhoria de **Acessibilidade e UX**: Inclusão de tooltips (balões informativos) nos itens do menu lateral quando recolhido.
  - Implementação de **Notificador de Gestão**: Badge dinâmica (círculo vermelho pulsante) no menu lateral para alertar sobre solicitações de acesso pendentes (exclusivo para administradores).
  - Corrigido: Ativada a funcionalidade do botão de **Reprovar Solicitação** na Gestão de Usuários (anteriormente exibia um alerta estático).
  - Estilização premium com cantos arredondados (`rounded-2xl`) e sombras suaves para melhor profundidade visual.
- **Exportação ZAJU (Reordenação de Colunas)**:
  - A query `QUERY_RELATORIO_ZAJU` sofreu refatoração total de renomeação de Headers e ordenação textual colunar obedecendo rigorosamente o output esperado pela área de auditoria / produto.
- **Performance (Dashboard)**:
  - Aumentado o pool de conexões com o `PostgreSQL` (`pool_size=20`, `max_overflow=20`) no `create_async_engine` para comportar pico de múltiplas aberturas de sessão.
  - Otimização da rota `/dashboard`: Restauração e implementação definitiva da concorrência `asyncio.gather()` nas 11 queries SQL injetando `AsyncSessionLocal()` no escopo bloqueado. Com isso a tela carrega de ~6s para ~1.5s preservando a integridade das conexões.

---

## [1.8.0] - 2026-04-09
### Adicionado
- **Segurança**: Centralização de `SECRET_KEY` e configurações de `ALLOWED_ORIGINS` (CORS) em variáveis de ambiente.
- **Resiliência Frontend**: Interceptor global de resposta para redirecionar usuários para login em caso de sessão expirada (401).
- **Utilitários**: Novo helper `parse_date_range` em `core/utils.py` para centralizar lógica de filtros temporais.
### Alterado
- **Refatoração (DRY)**: Eliminação de duplicidade de código no tratamento de datas em múltiplos endpoints do backend.
- **Backend**: Organização e limpeza de imports seguindo PEP 8.

---

## [1.7.0] - 2026-04-09
### Adicionado
- **Exportação Assíncrona (ZAJU)**: Implementado sistema de geração de relatórios em segundo plano para evitar timeouts. O arquivo Excel agora é enviado diretamente para o e-mail do usuário.
- **Mensageria**: Adicionado suporte a anexos de arquivos no `MailService`.
- **UI de Relatórios**: Novo feedback visual informando o processamento do relatório solicitado.

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
