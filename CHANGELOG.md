# Changelog - Dashboard Suzano

Todas as alterações notáveis neste projeto serão documentadas neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) e este projeto segue a [Semântica de Versionamento](https://semver.org/spec/v2.0.0.html).

---

## [1.9.6] - 2026-04-15
### Alterado
- **UX do Detalhamento de Sell-in**:
    - Centralização das colunas "Data Emissão", "Nota Fiscal", "Nº Documento" e "Tipo Doc Faturamento" no modal de inconsistências para melhor escaneabilidade visual.
    - Atualização do componente `PaginatedTable` para suporte nativo a alinhamento de colunas (`align: center`).

---

## [1.9.5] - 2026-04-15
### Alterado
- **Nome Oficial**: Ajuste final do nome da ferramenta para **Tradelinks Dashboard**.
  - Rebranding completo em todas as interfaces (Login, Sidebar, Título do Browser).
  - Atualização dos metadados de exportação de arquivos.

---

## [1.9.4] - 2026-04-15
### Alterado
- **Ajuste de Branding e UI**: Transição definitiva do nome do sistema para **Tradelinks Hub**.
  - Correção de alinhamento visual no Header da Sidebar, com centralização de sombras e ajuste de tipografia.
  - Atualização do subtítulo na tela de Login para "Plataforma de Performance e Dados".
  - Padronização total de títulos de exportação e metadados para o novo nome.

---

## [1.9.3] - 2026-04-15
### Alterado
- **Branding Final**: Transição do nome do sistema de "Dashboard Suzano" para **"Suzano TL Hub"**.
  - Atualização do `<title>` da aplicação para melhor SEO e identificação na aba do navegador.
  - Rebranding completo no Header da Sidebar e na tela de Login.
  - Atualização dos metadados de exportação de arquivos para o novo padrão.

---

## [1.9.2] - 2026-04-15
### Alterado
- **Rebranding do Dashboard**:
  - Atualização do título central de "Painel de Fechamento" para **"Painel de Performance e Dados"**, refletindo a expansão do escopo da ferramenta.
  - Atualização do rótulo da Sidebar de "Fechamento" para **"Controle e Monitoramento"**.
  - Padronização da nova nomenclatura nas telas de **Login** e **Relatórios**.
  - Atualização dos metadados de exportação e testes automatizados para conformidade com a nova identidade.

---

## [1.9.1] - 2026-04-15
### Alterado
- **Exportação Detalhada (Sell-in)**:
  - Expansão do relatório para suporte a múltiplas abas no Excel (`openpyxl`).
  - Adicionada a aba **"Resumo Inconsistencias"** como primeira aba do arquivo, refletindo fielmente a visão executiva e as colunas exibidas no modal do Dashboard.
  - Renomeada a aba técnica de detalhamento para **"Detalhamento Inconsistencias"**, mantendo a rastreabilidade completa de todos os itens e produtos.
  - Garantia de paridade estética Premium (Identidade Suzano) em ambas as abas geradas.

---

## [1.9.0] - 2026-04-13
### Adicionado
- **Relatório de Saldos Disponíveis**: Lançamento de novo relatório analítico que consolida os saldos de conta corrente por Customer Group, Linha de Investimento e Tipo de Verba.
- **Flexibilidade de Extração**: Implementação de modos de extração **Mensal** e **Anual**, permitindo visões por competência ou por exercício completo através de um novo seletor de ano dinâmico.
- **Exportação Premium**: Integração do novo relatório ao motor de exportação estilizado da Suzano, garantindo formatação financeira brasileira e identidade visual corporativa.

### Alterado
- **UX/UI (Relatórios)**: Reformulação da interface da aba de relatórios com um novo card expansivo para Saldos Disponíveis, utilizando ícones de alta fidelidade e sistema de cores laranja para destaque financeiro.

---

## [1.8.9] - 2026-04-13
### Adicionado
- **Infraestrutura de Filtragem (Dashboard)**: Implementação do estado `dateRange` no componente principal, permitindo sincronização global de períodos entre métricas, detalhes e exportações.
### Corrigido
- **Bug Fix (BUG-004)**: Resolvido erro de referência `dateRange is not defined` que causava falhas críticas em todas as funcionalidades de exportação do sistema.

---

## [1.8.8] - 2026-04-13
### Corrigido
- **Exportação de Inconsistências**: 
  - Correção crítica onde exportações e visualizações detalhadas retornavam arquivos vazios quando o período selecionado era diferente do mês atual (sincronização de parâmetros `start_date` e `end_date`).
- **Layout Técnico (Clientes)**:
  - Expansão do layout de exportação de Clientes baseado no `QUERY_ERRO_CLIENTES`, incluindo agora dados de contato, classificação de canais, regional e auditoria técnica completa.

---

## [1.8.7] - 2026-04-13
### Alterado
- **UX/UI (PaginatedTable)**:
  - Melhoria na legibilidade das tabelas de detalhamento através do aumento do contraste das linhas divisórias (`divide-slate-200`), facilitando a distinção visual entre registros em diferentes condições de iluminação.

---

## [1.8.6] - 2026-04-13
### Alterado
- **Identidade Visual (Sidebar)**:
  - Implementação de logo dinâmico no menu lateral.
  - Adicionado suporte ao logo reduzido (`suzano-logo-5.png`) para exibição quando o menu estiver recolhido, melhorando a estética e o reconhecimento da marca em espaços reduzidos.

---

## [1.8.5] - 2026-04-13
### Adicionado
- **Unificação de Identidade Visual Excel**:
  - Centralização da estilização premium em `backend/core/utils.py` através da função `apply_excel_premium_style` (Cabeçalho #0F172A, Fonte Branca Bold e Colunas Dinâmicas).
  - Novo endpoint genérico de exportação estilizada (`POST /data/export/styled`), habilitando suporte a múltiplas abas com o mesmo visual profissional.
### Alterado
- **Migração de Exportações para o Backend**:
  - Todas as exportações do frontend (Dashboard Geral e Categorias) foram migradas para o servidor para garantir paridade estética absoluta.
  - Atualizadas as rotas legadas de **ZAJU** e **CG Elegíveis** para o novo padrão visual de alta qualidade.
- **Otimização de Frontend**:
  - Remoção da biblioteca `xlsx` do projeto frontend, reduzindo o peso do bundle e concentrando a lógica de processamento de dados no backend.
### Corrigido
- **Navegação de Exportação**: Correção de bugs de sintaxe no `Dashboard.jsx` surgidos durante a refatoração das rotas de download.

---

## [1.8.4] - 2026-04-13
### Adicionado
- **Governança de Erros**: Criação do arquivo `BUG_LOG.md` na raiz do projeto para rastreabilidade técnica e histórico de incidentes.
### Alterado
- **UI/UX Pro Max (Modais e Tabelas)**:
  - Expansão da escala dos modais de detalhamento de `max-w-5xl` para **`max-w-7xl`**, otimizando a visualização em monitores widescreen.
  - Implementação de **Sticky Headers** e **Sticky Footers** no componente `PaginatedTable`, mantendo cabeçalhos e controles de página sempre visíveis durante a rolagem.
  - Estilização premium do rodapé de paginação: uso de `backdrop-blur`, sombras internas para profundidade e realce visual em `slate-50`.
  - Aumento da área útil das tabelas dentro do modal para `75vh`.
### Corrigido
- **Resiliência de Dados (SQL)**:
  - Substituição de `INTEGER` por **`BIGINT`** no casting de números de documentos, suportando IDs de larga escala e evitando erros de overflow.
  - Robustez no parsing de datas: suporte a separadores mistos (`/` e `-`) e limpeza automatizada de sufixos de hora em campos de data.
- **Estabilidade de Frontend**: Correção de `ReferenceError` em chamadas de exportação vazias.

---

## [1.8.3] - 2026-04-13
### Adicionado
- **Exportação Detalhada com Identidade Visual (Sell-In)**:
  - Implementação de novo endpoint de exportação no backend (`/export/sellin-detalhado`) utilizando `openpyxl`.
  - Aplicação de **Identidade Visual Suzano Premium**: Cabeçalhos em azul escuro (`#0F172A`), fonte branca em negrito e ajuste automático de largura de colunas.
### Alterado
- **Refatoração do Modal de Inconsistências (Sell-In)**:
  - Mudança na lógica de exibição para agrupamento por **Nota Fiscal/Nº Documento**, garantindo paridade entre o contador do dashboard e a listagem do modal.
  - Simplificação das colunas para visão executiva: Erros, Data Emissão, Cliente, Nota Fiscal, Documento e Tipo Faturamento.
### Corrigido
- **Robustez de Parsing de Data (PostgreSQL)**:
  - Implementação de lógica defensiva com Regex e `CASE` nas queries de Sell-In para suportar tanto o formato ISO (`AAAA-MM-DD`) quanto o formato brasileiro (`DD-MM-AAAA`) presentes nos registros JSON, eliminando o erro de `DatetimeFieldOverflowError`.
  - Formatação padronizada para `DD/MM/AAAA` sem componentes de hora.

---

## [1.8.2] - 2026-04-13
### Adicionado
- **Novo Relatório (CGs Elegíveis Verba Fixa)**:
  - Criação dinâmica de consulta que avalia faturamento histórico (retroativo de 3 meses `D-3`) em relação ao mês selecionado no painel.
  - Extração de listagem exibindo: Customer Group, Código do Cliente, Hierarquia (Marca) e Meses Faturados.
  - Implementação de query de alta performance usando JSONB (`@>`) e tabela derivada `v_produto_extensao_recursiva`.
  - Motor de exportação via `BackgroundTasks` (FastAPI) e `openpyxl` integrando a planilha `.xlsx` com envio limpo automatizado via `mail_service`.
  - Atualização do painel em React (Relatórios) convertendo o antigo placeholder para um widget ativo verde esmeralda com seletor de data (`type="month"`).
### Alterado
- **Identidade Visual**: Substituição do ícone da aba do navegador (favicon) pelo logo corporativo colorido (Tradelinks_Colorida.png).

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
- **Aba Provisão (VK11)**:
  - Implementação completa da nova aba do dashboard dedicada aos orçamentos.
  - Visão reestruturada: agrupamento de dados eliminando redundâncias de tipo de integração, focando estritamente em orçamentos do mês corrente (verificado rigorosamente através do período real de vigência nas colunas `valid_from` e `valid_to`).
  - Reformulação de **UX e Legibilidade Visual**:
    - Substituição do "banner escuro" redundante por um grid polido com 4 *KPI Cards* responsivos: *Volume Total, Sucesso, Aguardando Integração* e *Falha de Integração*, incluindo iconografia Lucide e animações *hover*. O card "Volume Total" assumiu um tom escuro premium (`slate-900`) e Sucesso verde orgânico (`emerald-600`), equilibrando a paleta.
    - O card de **Falhas de Integração** agora contêm um botão rápido e contextual de `EXPORTAR`, integrado com o gerador `.xlsx` preexistente da classe, facilitando os recortes contábeis da base.    - Humanização dos cabeçalhos da tabela técnica (ex: `pendente_integracao` -> `Pendentes`) para linguagem executiva de negócios.
    - Aplicação de máscara de cores inteligente na tabela de detalhamento: a ausência de gargalos (valores zerados) em pendências ou erros passou a receber uma fonte cinza neutra, limpando ruído visual e ajudando alertas coloridos a saltarem aos olhos de imediato.
- **Modernização do Dashboard (UI/UX)**:
  - Implementação de gráficos de rosca (`Donut Charts`) para monitoramento de saúde de integração, com aumento de escala (raio maior) para melhor visualização.
  - Visão detalhada por cartão: centralização do valor "TOTAL" e legenda lateral com contagem e percentual dinâmico.
  - Tradução e padronização das legendas para o padrão BRL: `Sucesso`, `Pendente` e `Erro`.
  - Otimização do Grid Layout: Refinamento da proporção da tela principal para **60% Integrações** vs **40% Inconsistências de Cadastro** (Grid-10), com as integrações agora distribuídas em 3 colunas iguais.
  - Implementação do **Log de Integrações**: Seção dedicada para monitoramento em tempo real do tráfego de dados entre SAP e Tradelinks.
    - Captura de **Dados de Entrada (Inbound)**: Via `integracao_requisicao`, incluindo rastreabilidade por número de **Lote**.
    - Captura de **Dados de Saída (Outbound)**: Via `suzano_integracao_servico` para monitoramento de envios ao SAP (ZVER, VK11, ZAJU).
    - Interface refinada com selos direcionais aumentados (`↑ TL -> SAP` / `↓ SAP -> TL`), inclusão de data completa (`DD/MM`) e iconografia especializada para cada processo (Logística, Financeiro, Cadastro).
    - **Ordenação Reversa (Chronological Sort)**: O painel passou a ordenar globalmente todos os itens (SQL `ORDER BY dta DESC`), exibindo rigorosamente primeiro a última integração recebida ou enviada.
  - **Aba Geral (Overview)**:
    - Otimização do Grid Layout: Refinamento da proporção da tela principal e ajuste de espaçamento (`gap-6`) para melhor respiro visual entre componentes.
    - Up-scale dos **Gráficos de Saúde**: aumento da área dos donuts (`w-48`) e ajuste de raios (`60/80`) para facilitar a leitura dos indicadores.
    - Ajuste de nomenclatura nos cards de topo para linguagem executiva: `Integrados com sucesso` e `Integrações Pendentes`.
    - Refinamento das legendas nos gráficos: retorno do termo simplificado `Pendentes` (anteriormente `Integrações Pendentes`) para otimização de espaço e legibilidade nos componentes de rosca.
    - O card de **Integrados com sucesso** foi migrado para o tema escuro (`slate-900`) com o valor numérico em verde esmeralda.
    - Expansão dos indicadores de saúde: Inclusão do status **Aguardando Retorno SAP** nos gráficos de *Ajustes de Provisão (ZAJU)* e *Pagamentos (ZVER)*.
    - Padronização da nomenclatura acadêmica nos headers de saúde para linguagem corporativa: `Ajustes de Provisão (ZAJU)`, `Provisão (VK11)` e `Pagamentos (ZVER)`.
    - **Log de Integrações**: Refinamento de nomenclatura na categoria `Provisões` para `Dados Provisões`, mantendo consistência entre backend e frontend.
    - **Reestruturação de Inconsistências**: 
        - Divisão das falhas em dois blocos lógicos: **Inconsistencias Integração** (ZVER, VK11, ZAJU) e **Inconsistências de Cadastro** (Sellin, Clientes, Produtos, Cutoff, Usuários).
        - A seção de Integração foi priorizada no topo da coluna lateral.
        - Inclusão da linha **Ajustes (ZAJU)** como indicador visual de erros de integração (funcionalidade de detalhamento via query pendente).
    - Correção de layout no painel de "Inconsistências de Cadastro", alterando sua restrição de altura vertical para `h-fit`, o que elimina os incômodos espaços em branco no bloco quando renderizado ao lado do Log de Integrações.
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
*Atualizado em: 15 de Abril de 2026 por Antigravity AI.*
