# Changelog - Dashboard Suzano

Todas as alterações notáveis neste projeto serão documentadas neste arquivo. O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) e este projeto segue a [Semântica de Versionamento](https://semver.org/spec/v2.0.0.html).

---

## [2.4.3] - 2026-04-28
### Corrigido
- **Frontend**: Corrigida a ausência do import `NotificationSettings` em `App.jsx`, que estava causando a quebra do carregamento da árvore React (white screen).
- **Frontend**: Resolvidos conflitos de `Temporal Dead Zone` e dependências no arquivo de configurações de notificações, mantendo o build Vercel estável.

## [2.4.2] - 2026-04-28
### Corrigido
- **Frontend**: Removida a dependência `react-hot-toast` que não estava instalada no projeto e causava tela branca (crash) ao carregar a aplicação. Substituída por alertas nativos temporários.

## [2.4.1] - 2026-04-28
### Corrigido
- **Backend**: Corrigido erro de importação do `get_current_active_user` que impedia o boot da aplicação no Vercel. Substituído por `get_current_user` do módulo `api.data`.

## [2.4.0] - 2026-04-28
### Adicionado
- **Funcionalidade**: Sistema de Notificações Automáticas via E-mail. Agora administradores podem configurar destinatários e horários (2x ao dia) para receber um resumo executivo premium com o status das integrações (VK11, ZAJU, ZVER e Dados Mestres).
- **Interface**: Nova página de "Configurações de Notificação" para gestão de e-mails e agendamentos.
- **Backend**: Implementação do motor de agendamento `APScheduler` e integração com o `fastapi-mail`.

## [2.3.59] - 2026-04-28

---

## [2.3.42] - 2026-04-28
### Adicionado
- **Inteligência de Monitoramento ZAJU**: Implementada notificação contextual no card "Aguardando Integração". O sistema agora identifica se as pendências volumétricas são compostas exclusivamente por itens com **Fluxo Suspenso**, exibindo um alerta informativo para evitar falsas preocupações operacionais.

---

## [2.3.41] - 2026-04-28
### Alterado
- **Informativo de Ciclo de Integração**: Atualizado o texto informativo para indicar que o ciclo ocorre no **dia 30**, substituindo a menção genérica ao "último dia do mês corrente".

---

## [2.3.40] - 2026-04-28
### Alterado
- **KPI de Eficiência ZAJU (Ajuste Operacional)**: Refatorada a fórmula da Taxa de Eficiência para desconsiderar itens em "Ciclo Agendado" (Aguardando Integração). A taxa agora reflete a relação real entre **Sucessos vs Bloqueados**, evitando distorções causadas por grandes volumes de dados aguardando o horário de processamento planejado.

---

## [2.3.39] - 2026-04-28
### Adicionado
- **Diferenciação Direcional de Alertas**: O sistema de notificações no Log de Integrações agora identifica automaticamente se a falha de fluxo é de **recebimento** (SAP > TL) ou de **envio** (TL > SAP), fornecendo um diagnóstico granular e acionável.

### Alterado
- **Nomenclatura Cockpits (Business-Ready)**:
  - Painel de Pagamento (ZVER): `Registros Financeiros` atualizado para **`Pagamentos`**.
  - Painel de Ajuste (ZAJU): `Registros Aprovados` atualizado para **`ZAJUS`** e `Aguard. Integração` expandido para **`Aguardando Integração`**.
- **Refinamento de UX de Alerta**: Nova redação assertiva para o banner de inatividade ("Ponto de Atenção: Inatividade de Fluxo") com orientações de verificação de canal.

---

## [2.3.38] - 2026-04-28
### Adicionado
- **Inteligência de Monitoramento Temporal**: O sistema de notificações agora valida a data real de cada integração crítica. Mesmo que um item conste no log, se o registro for anterior a 24 horas (ex: logs históricos de Usuários), um alerta de inatividade é gerado automaticamente.

### Corrigido
- **Normalização de Categorias (Fuzzy Matching)**: Implementada função de normalização de strings no Log de Integrações para lidar com discrepâncias entre o banco de dados e o frontend (ex: `USUARIOS` vs `Usuários`). Agora o mapeamento de ícones e a detecção de atrasos ignoram acentos e diferenças de caixa Alta/Baixa.
- **Mapeamento de Ícones**: Corrigido bug onde categorias sem acento no banco (como `USUARIOS` ou `DADOS PROVISOES`) perdiam a identidade visual e exibiam o ícone genérico de histórico.

---

## [2.3.37] - 2026-04-28
### Adicionado
- **Sistema de Notificação de Log**: Implementado monitoramento ativo de inatividade nas rotinas de integração. Se uma categoria crítica (Sell-In, ZAJU, ZVER, VK11 ou Retorno) não registrar atividade por mais de 24h, o Log de Integrações agora exibe um banner de alerta pulsante (`Zap`) para ação imediata.
- **Cromatismo Dinâmico de Performance**: Os percentuais de saúde nos gráficos Donut e KPIs de volume agora mudam de cor conforme a proximidade com a meta de 100%: Verde (≥99.5%), Amarelo (≥95%) e Vermelho (<95%).

### Alterado
- **Nomenclatura Executiva**: Atualizado o rótulo de "Aguardando SAP" para **"Aguardando Integração"** no dashboard principal para uma comunicação mais voltada ao processo de negócio.
- **Simetria de Layout (Alinhamento Vertical)**: Ajustado o grid principal e os containers de flexbox para garantir que a coluna do Log de Integrações e as colunas de Inconsistências tenham exatamente a mesma altura, alinhando as bases visuais do dashboard.
- **Refinamento de Gráficos**: Padronização da posição das legendas (`mt-auto`) e espaçamento do container de gráficos para garantir alinhamento horizontal perfeito entre os cards de saúde das integrações.

---

## [2.3.36] - 2026-04-27
### Corrigido
- **Falsos Positivos no Modal de Inconsistências (Linhas Fantasmas)**: Corrigida a lógica de filtragem das consultas detalhadas das filas de integração (`Sell-in`, `Clientes` e `Usuários`). Anteriormente, o validador mestre dos contadores considerava um registro resolvido caso a Chave Primária existisse no banco destino, contudo, o modal *extrainterrogava* se toda a carga de propriedades ("campos menores") enviada originalmente constava idêntica e intocada no destino. Qualquer edição posterior feita no banco (ou manual) deixava a flag do erro perpetuamente retida no modal sob a forma de uma "linha fantasma". O grau de criticidade da *Detail Query* foi rebaixado e alinhado integralmente com o contador do Dashboard, exigindo a resolução apenas pela completude da Chave Primária da Fila.

---

## [2.3.35] - 2026-04-27
### Adicionado
- **Legendas de Retorno em Tempo Real**: Os *cards* sumários da seção "Operação Ativa" (`ZAJU` e `ZVER`), que já contabilizavam e desenhavam a fatia de `Pendente Retorno` no Gráfico de Rosca, agora exibem formalmente essa informação na régua de legendas textuais na parte inferior do card, com a tag e a cor correta (`#indigo`).

---

## [2.3.34] - 2026-04-27
### Corrigido
- **Divergência de Contagem no Modal de Inconsistências**: Corrigido um bug na aba lateral "Inconsistências de Cadastro". Os volumetrais mestres dos cards (ex: "Faturamento: 1 erro") exibiam uma contagem correta com base no filtro de datas ativo, entretanto, ao abrir o modal para drill-down, múltiplos registros não relacionados ao período aparente eram despejados, dando a sensação de um mismatch de dados. Isso acontecia pois o componente visual (`Dashboard.jsx`) falhava em trafegar os parâmetros `$start_date` e `$end_date` da barra de filtros para a requisição de detalhamento (`getInconsistenciasData`), fazendo a API retornar uma varredura *lifetime* do banco de dados ao invés de respeitar a janela em visualização. A passagem de parâmetros foi reestabelecida.

---

## [2.3.33] - 2026-04-27
### Alterado
- **Readequação Semântica de Falsos Positivos**: 
  - Faturas com fluxo bloqueado (propositalmente suspensas) como `ZAJU_AJUSTE_PGTO` e fluxos de reprovação que disparavam visualmente erros alarmantes vermelhos (`ERROS DE INTEGRAÇÃO`) foram neutralizadas. Passam a exibir apenas `INTEGRAÇÃO SUSPENSA` e eficiência com status neutro de `Fluxo Suspenso`.
  - Rotinas transacionais que processam Volume igual a 0 no mês não computarão mais o equívoco `0%` vermelho. Categoria de saúde das mesmas foi substituída pela indicação neutra informacional `Sem Volume`.

---

## [2.3.32] - 2026-04-27
### Adicionado
- **Regras de Informativo Estendido**: Expandido o *badge* de aviso ("Ciclo de Integração: Ocorre somente no último dia do mês corrente") para também cobrir faturas de Acordo Comercial atreladas a Verba Nominais (`ZAJU_AJUSTE_VERBA_CONTRATO_NOMI` e `ZAJU_AJUSTE_VERBA_NOMI`).

### Alterado
- **Neutralização de Eficiência (Scheduled Tasks)**: Ajustada a lógica de "Status de Eficiência" para que rotinas do ZAJU com disparos agendados no fechamento do mês (CUTOFF e NOMINAIS) não fiquem em coloração vermelha (crítica) durante a acúmulação em mês ativo. Em vez do balão de `%` com erro alertando eficiência ruim, eles adotam a semântica neutra acinzentada dizendo **"Ciclo Agendado"**.

---

## [2.3.31] - 2026-04-27
### Alterado
- **Navegação ZAJU em Abas Nativas**: A arquitetura de navegação por *pills* flutuantes foi totalmente reestruturada para um modelo de "Folder Tabs" integradas nativamente ao cabeçalho do container principal de dados. 
- **Typography Upscale**: As fontes das colunas de acompanhamento de status ('Status de Integração e Saúde') foram redimensionadas e fortalecidas para ampliar a legibilidade executiva do dashboard.

### Adicionado
- **Notificador Inteligente de Abas (Smart Badges)**: Cada aba da respectiva rotina ZAJU agora exibe um alert icon pulsante (`Ping`) caso identifique registros críticos (como SLAs atrasados ou bugs listados na aba) — permitindo uma triagem sem precisar abrir todas as tabelas cegas.

---

## [2.3.30] - 2026-04-27
### Adicionado
- **Destaque de SLA Crítico ZAJU**: Incluído cálculo na extração do banco (`pending_return_critical`) para identificar itens "Pendente Retorno" travados no SAP por mais de 2 dias. No frontend, estes itens disparam um alerta visual dinâmico em vermelho pulsante listando a quantidade de faturas atrasadas (Ex: `X Atrasados (>2 dias)`).

---

## [2.3.29] - 2026-04-27
### Adicionado
- **Clarificação Temporal ZAJU Cutoff**: Foram introduzidas sub-leggings visuais dinâmicas diretamente nas linhas de detalhamento. Para o "Fechamento Anterior (Cutoff)", os pendentes recebem um label explícito "(Ref. Mês Atual)" indicando que estão no escopo da janela ativa, e os items com sucesso são demarcados como "(Ref. Fechamento Anterior)". Notas explicativas detalhando o calendário oficial do ciclo de fechamento foram ancoradas acima do título da rotina.

---

## [2.3.28] - 2026-04-27
### Alterado
- **Sincronização UI ZAJU vs Pagamentos**: Réplica exata (1:1) do design de cards da tela 'Pagamentos' para a aba ZAJU, introduzindo o card de "Meta do Período" e padronizando o background da "Taxa de Eficiência".
- **ZAJU Concept Integrado**: Tradução das variáveis financeiras (`R$`) do design original para uma proporção de volume (`% vol.`), honrando a natureza contábil de registros da ZAJU enquanto preserva o requinte estético referencial.

---

## [2.3.27] - 2026-04-27
### Alterado
- **Padronização Visual ZAJU**: Reversão da quebra de linha das métricas, alinhando todos os 6 cards horizontais no mesmo eixo (`grid-cols-7`).
- **Resizing de Cartões**: Redução das dimensões mínimas e ajuste tipográfico (`text-5xl` para `text-3xl`/`4xl`) para adequar-se à padronização das outras abas (ex: Pagamentos), mantendo a ênfase visual de espaço duplo (`col-span-2`) para a Taxa de Eficiência.

---

## [2.3.26] - 2026-04-27
### Corrigido
- **Hotfix de Renderização**: Resolvido erro crítico (White Screen / Error Boundary) na aba ZAJU causado pela chamada de um componente de ícone não importado (`ChartBar`). Substituído pelo `BarChart3` validado.

---

## [2.3.25] - 2026-04-27
### Alterado
- **Reengenharia de Layout ZAJU**: Implementada hierarquia de informação em dois níveis (Estratégico vs Operacional) usando uma grade robusta de 4 colunas.
- **Maximização de Legibilidade**: Aumentada a escala dos cards (`min-h-160px`) e tipografia para KPIs principais, otimizando o monitoramento em centros de comando (War Rooms).
- **Grouping Visual de Pipeline**: Métricas de fluxo agora possuem indicadores de progresso proporcionais ao volume total.

---

## [2.3.24] - 2026-04-27
### Alterado
- ** cockpit ZAJU Reestruturado**: Card de Taxa de Eficiência global movido para a primeira posição e ampliado para destaque executivo.
- **Cromatismo de Diagnóstico**: Badges de eficiência de cada item agora possuem cores dinâmicas (Verde/Amarelo/Vermelho) baseadas no percentual de sucesso, permitindo diagnóstico visual instantâneo.

---

## [2.3.23] - 2026-04-27
### Corrigido
- **Hotfix de Compilação (Vite/Esbuild)**: Removida tag `</div>` redundante que causava erro de interpretação de expressão regular no parser do Vite durante o build de produção.

---

## [2.3.22] - 2026-04-27
### Corrigido
- **Restauração de Arquitetura JSX**: Corrigida a quebra estrutural entre as abas VK11 e ZAJU. Restaurada a lógica de renderização condicional e o aninhamento correto de blocos, resolvendo definitivamente o erro de build em produção.

---

## [2.3.21] - 2026-04-27
### Corrigido
- **Hotfix de Estabilidade (JSX Syntax)**: Removido fechamento de bloco duplicado que estava impedindo o build no ambiente de produção (Vercel).

---

## [2.3.20] - 2026-04-27
### Adicionado
- **Telemetria de Eficiência Seletiva (ZAJU)**: Upgrade no cálculo da taxa global para desconsiderar itens não integráveis (bloqueados), fornecendo um KPI real de performance.
- **Esquema de Meta Real vs Ideal**: Implementação do design de comparação (Real/Ideal) com meta de 100% no cockpit de ZAJU.
- **Status Dinâmico Inteligente**: Substituição de legendas estáticas por indicadores de saúde em tempo real ("Processamento Crítico", "Aguardando Retorno", "Fluxo Saudável").
- **Design de Alta Densidade**: Remoção de textos redundantes e otimização do layout para uma visualização executiva mais limpa.

---

## [2.3.19] - 2026-04-27
### Alterado
- **Precisão de Eficiência (ZAJU)**: Upgrade no cálculo de eficiência para exibir uma casa decimal (ex: 99.6%), garantindo transparência absoluta quando há itens ainda em processamento ou retorno.
- **Simplificação de Labels**: Alterado o termo "Bloqueado" para "Erros" na coluna de saúde dos ajustes para uma comunicação mais direta.

---

## [2.3.18] - 2026-04-27
### Adicionado
- **Informativo de Regra ZAJU**: Adicionada nota instrutiva para o item `ZAJU_CUTOFF_MES_ANTERIOR` referente ao ciclo de integração (somente após dia 01 do mês seguinte).
- **Otimização de Escala de Gráficos**: Redução da largura mínima dos gráficos de barra (380px para 260px) para melhorar a percepção visual de variações e desvios de integração.
- **Refinamento de UX**: Ajuste no layout dos itens de monitoramento para suportar mensagens de sistema e avisos regulatórios sem comprometer o alinhamento.

---

## [2.3.17] - 2026-04-27
### Alterado
- **Ajuste de Terminologia**: Substituição global do termo "Financeiro Bloqueado" por "Erros de Integração" em todos os módulos e seções do dashboard para maior precisão técnica.

---

## [2.3.16] - 2026-04-27
### Adicionado
- **Cockpit Financeiro (ZAJU)**: Padronização total de terminologia com a aba de Pagamentos ("Financeiro Bloqueado", "Em Processamento", "Aguardando Retorno").
- **Telemetria Cromática de Eficiência**: Implementação de escala de cores dinâmica no card de eficiência (Esmeralda/Âmbar/Rosa) baseada na proximidade com a meta ideal.
- **Upgrade Dimensional de Fontes**: Aumento significativo na escala tipográfica: nomes de ajustes (text-lg), volumes (text-3xl) e labels de telemetria com peso font-black.
- **UX de Alta Visibilidade**: Adição de efeitos de brilho (shadows) coloridos nas barras de progresso e ícones expansivos (w-14) para identificação instantânea de status.

---

## [2.3.15] - 2026-04-27
### Adicionado
- **Otimização de Espaço (Sub-Abas ZAJU)**: Implementado sistema de sub-navegação interno na aba ZAJU, consolidando as seções Promo, Contrato e Acordos em uma única "página" dinâmica.
- **Navegação de Alta Fidelidade**: Adicionada barra de menu secundária com estilo executivo (pill-shape e shadow-inner), eliminando a necessidade de rolagem excessiva.
- **Performance de Visualização**: Renderização condicional por sub-aba, garantindo que o usuário mantenha o foco na categoria selecionada enquanto preserva a visão dos KPIs globais no topo.

---

## [2.3.14] - 2026-04-27
### Adicionado
- **Visibilidade Total (Zero State ZAJU)**: Implementada lógica para exibir todos os 12 tipos de ajuste nas categorias correspondentes, mesmo quando não há registros no banco, garantindo visibilidade operacional completa.
- **Redistribuição de Destaques**: Movimentação dos itens `ZAJU_AJUSTE_VERBA_PERC` e `CUTOFF` explicitamente para a seção "Verba Promo & Ações".
- **Upgrade Tipográfico**: Aumento do tamanho da fonte dos nomes dos ajustes (font-black text-base) e dos labels de status para facilitar a leitura rápida em monitores operacionais.
- **Hierarquia Visual Primium**: Ajuste de padding e distribuição dos itens para uma visualização mais equilibrada e profissional.

---

## [2.3.13] - 2026-04-27
### Adicionado
- **Categorização Estrutural (ZAJU)**: Implementada a separação dos ajustes em 3 macro-categorias: "Verba Promo & Ações", "Verba de Contrato" e "Acordos (Planejamento/Apuração/Pagamento)".
- **Inteligência de Verba**: Adicionada lógica de JOIN no backend para discriminar volumes de **Cutoff** conforme o tipo de verba (Contrato vs Promo), fornecendo quantidades específicas por categoria.
- **Sinalização de Bloqueio**: Implementados badges de status "BLOQUEADO" e avisos informativos para tipos de ajuste não integráveis (ZAJU_AJUSTE_PGTO, ZAJU_APUR_REPROVADA, ZAJU_PGTO_REPROVADO).
- **Refinamento de UX**: Reorganização da interface em seções colapsáveis/distintas com ícones específicos por tipo de verba.

---

## [2.3.12] - 2026-04-27
### Corrigido
- **Hotfix de Estabilidade (Tab ZAJU)**: Resolução de erro crítico de tela branca (`ReferenceError`) através da correção de importações de ícones e implementação de blindagem exaustiva contra dados nulos via `optional chaining`.

---

## [2.3.11] - 2026-04-27
### Adicionado
- **Reestruturação Premium (Tab ZAJU)**: Reformulação completa da interface de Ajustes de Provisão, seguindo o padrão visual de alta fidelidade do dashboard.
- **Detalhamento por Categoria (Telemetry)**: Implementação de monitoramento discriminado para as 12 categorias de ZAJU (Ajustes de Verba, Cutoff, Ajustes de Pagamento, etc.).
- **Visual Health Bars**: Adicionados indicadores visuais de progresso e saúde por categoria, facilitando a identificação imediata de Integrados, Erros, Pendentes e Retornos.
- **Padronização Técnica**: Refatoração interna do identificador de aba de `zaku` para `zaju` para consistência com o domínio de negócio.

---

## [2.3.10] - 2026-04-27
### Corrigido
- **Correção Temporal (Fator Fuso Horário)**: Ajuste na lógica de extração do mês de referência para evitar o recuo de data causado pelo fuso horário UTC, garantindo que o dashboard exiba "Abril" corretamente conforme o período selecionado.

---

## [2.3.9] - 2026-04-27
### Adicionado
- **UI/UX (Formatação de Dados)**: Implementação de formatação monetária (R$) automática nas tabelas de logs de inconsistência (Pagamentos, Provisões e Sell-In).
- **Correção de Parser**: Suporte a strings brutas de moeda vindas do banco, garantindo que valores como "1.234,56" sejam exibidos corretamente como R$ 1.234,56.

---

## [2.3.8] - 2026-04-27
### Alterado
- **Alinhamento de KPIs (Foco em Excelência)**: Atualização da Meta do Período de 99.5% para **100%**, refletindo o compromisso com o cenário ideal de integração total e erro zero.

---

## [2.3.7] - 2026-04-27
### Corrigido
- **Estabilidade Analítica (Hook Order Fix)**: Correção de erro crítico de referência (`ReferenceError`) causado pela inicialização incorreta de hooks. O estado `dateRange` agora precede o cálculo de lógica temporal, garantindo a carga do dashboard.
- **Robustez de UI**: Refinamento da lógica de detecção de datas para evitar falhas durante estados de carregamento assíncrono.

---

## [2.3.6] - 2026-04-27
### Corrigido
- **Estabilidade Global (Exhaustive Hotfix)**: Varredura completa e implementação de proteções contra dados nulos em todos os módulos do dashboard (Gráficos, Modais, KPIs de ZVER, ZAJU e VK11). Garantia de resiliência total da interface durante o carregamento assíncrono de dados.

---

## [2.3.5] - 2026-04-27
### Corrigido
- **Estabilidade (Hotfix)**: Implementação de *Optional Chaining* (`?.`) e proteções contra valores `undefined` que causavam a quebra da interface (White Screen) durante o carregamento inicial dos dados ou transição entre abas.
- **Resiliência de Datas**: Adicionada validação para o cálculo do mês de referência, evitando falhas de string em caso de datas nulas ou inválidas.

---

## [2.3.4] - 2026-04-27
### Adicionado
- **Dinamismo e Identidade Visual (Pagamentos)**:
    - **Escala de Cor Inteligente**: A Taxa de Eficiência agora altera sua cor dinamicamente (Verde/Amarelo/Vermelho) conforme a proximidade da Meta Ideal (100%).
    - **Referência Temporal**: Inclusão automática do nome do mês de referência no cabeçalho do Fluxo Financeiro.
    - **Nomenclatura Executiva**: Labels renomeadas para melhor identificação de negócio: "Financeiro Bloqueado" (Erro) e "Em Processamento" (Pendente).

---

## [2.3.3] - 2026-04-27
### Alterado
- **UX/UI (Padronização de Headers)**: 
    - Unificação da estrutura vertical dos cards de "Meta" e "Eficiência". 
    - Garantia de paridade no grid de KPIs através da implementação de distribuição `flex-col` consistente em todos os indicadores da aba de pagamentos.

---

## [2.3.2] - 2026-04-27
### Alterado
- **UX/UI (Alinhamento de Cockpit)**: 
    - Implementação de alinhamento simétrico nos cards de KPI da aba de pagamentos. 
    - Adição de alturas mínimas nos containers de etiquetas e uso de `flex-grow` para garantir paridade horizontal dos valores monetários e índices principais, mesmo em condições de quebra de texto (ex: "Aguardando Retorno").

---

## [2.3.1] - 2026-04-27
### Adicionado
- **Detalhamento de Fluxo Financeiro (ZVER)**:
    - Expansão do Cockpit de Pagamentos para 6 colunas, permitindo a visualização isolada de **"Pendente Retorno SAP"** e **"Aguardando Integração"**.
    - Inclusão do campo `total` no payload de métricas do backend para maior precisão em cálculos estatísticos de saúde de integração.

### Corrigido
- **Cálculo de Eficiência Operational**: Resolução do bug que exibia "0.0%" no card de eficiência de pagamentos devido a falta de parâmetro de soma total. A fórmula agora considera dinamicamente todos os estados de processamento.
- **Build de Produção (Vercel)**: Removida redundância de importação do hook `useMemo` em `Dashboard.jsx`, corrigindo falhas de compilação no ambiente de deploy.

---

## [2.3.0] - 2026-04-27
### Adicionado
- **Otimização de Performance (Consolidação de Queries)**:
    - Refatoração do endpoint de métricas do dashboard para utilizar consultas SQL consolidadas (`Bach Querying`). Sete contagens de erro independentes foram unificadas em uma única transação, reduzindo o consumo de conexões simultâneas e o overhead de latência por requisição.
    - Implementação de um framework de auditoria de performance (`perf_audit.py`) para identificação proativa de gargalos de indexação e volume de dados.

### Alterado
- **UX/UI Resilience (Memoização)**:
    - Implementação de `React.memo`, `useMemo` e `useCallback` nos componentes de alta frequência de atualização (`IntegrationHealthCard` e `IntegrationLog`), eliminando re-renderizações desnecessárias e garantindo suavidade visual durante os refreshes automáticos de 5 minutos.
- **Processo de Manutenção**:
    - Padronização da limpeza de artefatos de diagnóstico e scripts de teste temporários para manter a integridade do ambiente de desenvolvimento.

### Recomendado (Infraestrutura)
- **Documentação de Performance**: Publicação de recomendações técnicas com scripts SQL específicos para criação de índices concorrentes em tabelas de alto volume (142k+ registros).

---

## [2.2.2] - 2026-04-22
### Adicionado
- **Infraestrutura de Homologação**:
    - Criação da branch `staging` para deploys isolados no Vercel.
    - Implementação de configuração **"Environment Aware"**: o sistema agora detecta automaticamente o ambiente (`VERCEL_ENV`) e prioriza variáveis com o prefixo **`STAGING_`** (ex: `STAGING_SUPABASE_DATABASE_URL`), facilitando a gestão de segredos no Vercel sem conflitos de nomes.
    - Suporte a múltiplas origens dinâmicas no CORS através da variável de ambiente `ALLOWED_ORIGINS` (lista separada por vírgulas).
    - Lançamento do arquivo `backend/.env.example` com guia de configuração multi-ambiente.

### Corrigido
- **Infraestrutura (Circular Import)**: Resolvida falha crítica de inicialização (`ImportError`) que impedia o boot da aplicação na Vercel. A lógica de `Slowapi` (Rate Limiting) foi movida para um módulo centralizador (`core/limiter.py`), garantindo a ordem correta de carregamento das rotas e do objeto de estado da aplicação.

---

## [2.2.1] - 2026-04-17
### Adicionado
- **Resiliência de Interface (Hardenning)**:
    - Implementação do componente **ErrorBoundary** nas rotas protegidas para capturar erros de renderização e evitar a "tela branca" total.
    - Adição de proteções defensivas (*Optional Chaining* e *Default Values*) em todos os cálculos de KPI do Cockpit para lidar com respostas parciais do backend.

### Alterado
- **UX/UI Premium (Painel Geral)**:
    - **Acessibilidade Cognitiva**: Melhoria do feedback de sucesso na Central de Inconsistências. Casos com "Zero erros" agora recebem a tag de verificação explícita ("Tudo OK") em vez de adotarem visual inativo/desabilitado.
    - **Scannability (Leitura Dinâmica)**: Injeção de iconografia nativa `lucide-react` antes de cada categoria no Hub de Ações, encurtando o tempo de reconhecimento dos usuários para cada módulo operacional (ex. Cartão de Crédito para Pagamentos, Pacote para Produtos).
    - **Micro-interações e Sombras**: Adição de elevações virtuais responsivas ao uso do mouse (`hover:-translate-y-1`) nos cards de KPI superiores, e refinamento dos fundos trocando relevos densos (`shadow-xl`) por difusores suaves de menor espessura (`shadow-lg`).
    - **Ergonomia e Legibilidade (Upscale Tipográfico)**: Aumento generalizado na escala das fontes (de `10px` e `11px` para `12px`, `14px` e `16px`) em indicadores, logs e categorias, promovendo melhor conforto visual em sessões prolongadas de uso e suporte a telas grandes, sem quebrar o grid operacional 60/40.
- **UX/UI Premium (Aba Pagamentos)**:
    - **Redistribuição Estratégica (Hero Section)**: O card "Meta do Período" (99.5% de Integração) foi realocado para o topo, expandindo a malha de totalizadores para 5 colunas. Essa mudança posiciona o KPI corporativo na área principal de visualização da tela.
    - **Aprimoramento do Painel de Resolução**: O painel "Resolução de Conflitos" foi reestruturado para acompanhar perfeitamente o crescimento vertical da barra de performance vizinha (`flex-1 h-full`), com escalas de alertas, centralização e proporção alinhadas ao padrão de impacto visual.
    - **Grid Simétrico (Fluxo Financeiro)**: A área sob o grande valor em destaque de "Fluxo Financeiro Integrado" foi redesenhada de um agrupamento misto flex para uma grade simétrica rígida de 4 divisões fixas (Volume Mensal, Impacto em Erro, Previsão Pendente e um novo CTA de Exportar "PAGAMENTOS COM SUCESSO"), trazendo estabilidade visual máxima.
    - **Afinamento Tipográfico (Clientes)**: Ampliação estruturada em cascata para textos do ranking `Performance por Cliente` e alteração da nomenclatura base de volume de mercado de "X REGISTROS" para a semântica mais apurada "X PAGAMENTOS".

### Corrigido
- **Bug Crítico de Renderização**: Resolvida a falha de referência ao ícone `Zap` que causava travamento do Dashboard imediatamente após o carregamento.

---

## [2.2.0] - 2026-04-16
### Adicionado
- **Reestruturação de Inconsistências (Cadastro)**:
    - **Produtos**: Modernização do modal com layout otimizado (ID, Nome, Status e Hierarquia 1). Implementada Exportação Detalhada com 20 colunas e consolidação de hierarquias.
    - **Cutoff**: Novo layout de modal incluindo campos de **Lote** e **Nº Doc. Faturamento** para maior rastreabilidade.
    - **Usuários**: Reestruturação completa do pré-cadastro com humanização de dados (Sim/Não para booleanos) e rastreio por Lote.
    - **Geral**: Evolução para o padrão **Global Cockpit Premium**. Implementada arquitetura 60/40 (Saúde vs Resolução) com design de alta fidelidade, KPIs dinâmicos e Hubs de inconsistência categorizados.
    - **Pagamento (ZVER)**: Reestruturação completa UI/UX para o padrão **Command Hub**. Adicionada paleta Emerald/Green, KPI de Taxa de Eficiência, Hero Section com gradientes premium e ranking de performance modernizado.
    - **Integrações (VK11, ZAJU)**: Refatoração completa dos modais com centralização de dados, priorização da coluna de Erros e exportação técnica de alta fidelidade. Implementada funcionalidade de **tooltip inteligente** para visualização de mensagens de erro longas.
- **Nomenclatura Executiva**: Evolução do título dos modais de detalhamento para **"Log de Inconsistências: [Categoria]"**, eliminando termos genéricos e elevando o tom corporativo da plataforma (ex: **Faturamento (Sell-In)**).
- **Padronização de UX Pro Max**: Centralização global de cabeçalhos e dados em todos os modais de inconsistência e integração para paridade visual premium. Rótulo unificado **"Exportação Detalhada"** aplicado universalmente a todos os botões de exportação (cards e modais). Padronização das abas de navegação para **Pagamento (ZVER)**.
- **Exportação Detalhada**: Implementado o motor de exportação customizada de alta fidelidade para os módulos de Produtos, Usuários, Cutoff, Pagamentos, VK11 e ZAJU.

### Corrigido
- **Query de Pagamentos (Erro de SQL)**: Corrigida a referência de campos técnicos (`doc_type`, `cond_type`, `tipo_acao`) que causava erro no PostgreSQL. As colunas foram movidas da tabela `pagamento_acao` para a tabela de integração correspondente.
- **Sanitização de Dados (Produtos)**: Resolvida a extração incorreta de campos técnicos de Java (`java.util.ArrayList`). Agora, campos como **Unidade de Negócio** exibem apenas os valores reais em vez de metadados de sistema.
- **Exportação Excel (Bug de Layout)**: Resolvido bug de aninhagem no payload (`api.js`) que causava a exportação de colunas genéricas (`title`/`sheets`) em vez dos dados reais.
- **Humanização de Dados**: Garantida a aplicação de labels de negócio (Ativo/Inativo, Sim/Não) tanto na visualização em tela quanto nos arquivos exportados.

---

## [1.9.9] - 2026-04-15
### Adicionado
- **Detalhamento de Clientes (UX & Relatório)**:
  - Novo modal de inconsistências de clientes com colunas agregadas: "Cliente" (ID + Nome), "Customer Group" (ID + Nome) e "Regional" (ID + Regional).
  - Implementada a **Exportação Detalhada** para Clientes, gerando um relatório Excel de aba única ("Detalhamento Inconsistencias") com 17 colunas técnicas, incluindo "Data Registro" logo após os erros.
  - Padronização visual premium aplicada ao novo relatório.
  - Refinamento de nomenclaturas no Excel: "Status", "Contato", "Email", "Telefone", "SAP Recebedor", etc.
  - Renomeação da coluna "Ativo/Inativo" para **"Status"** no Modal de Clientes.
  - Correção da exibição do campo Status no modal, garantindo o mapeamento correto dos dados binários.
  - **Aprimoramento de UX no Modal (Opção 2)**:
    - Centralização de todos os cabeçalhos e dados das colunas.
    - Implementação de **Tooltip Refinado**: Mensagens de erro são exibidas em até 2 linhas com `cursor-help`, permitindo visualização completa ao passar o mouse sem comprometer a altura das linhas.
    - Alinhamento vertical centralizado para todos os registros da tabela.

---

## [1.9.8] - 2026-04-15
### Alterado
- **Exportação Detalhada (Sell-in)**:
    - Renomeada a coluna "Referência" para **"Referência Faturamento"** na aba "Detalhamento Inconsistencias" para maior clareza técnica conforme solicitação.

---

## [1.9.7] - 2026-04-15
### Alterado
- **UX do Detalhamento de Sell-in**:
    - Centralização de todos os cabeçalhos e colunas ("Erros", "Data Emissão", "Cliente", "Nota Fiscal", "Nº Documento" e "Tipo Doc Faturamento") para uma paridade visual completa no modal de inconsistências.

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
*Atualizado em: 28 de Abril de 2026 por Antigravity AI.*
