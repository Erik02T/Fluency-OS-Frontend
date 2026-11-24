# Fluency OS · Fechamento da homologação de 23/11/2026

**Caso 42 aprovado em 24/11/2026 no build `I_MPile6KGPanKuoQ1E6t`.** Firefox ESR com Orca confirmou que **Voltar** restaura o foco nos três catálogos. Os demais resultados correspondem à rodada original do build `vXIPy-xX2r6G_Bpqe39Jz`, com 42 aprovações, incluindo o Swagger no caso 40.

## Versão e ambiente da rodada original

- Frontend `main` a partir de `021c04040893e23820ec12b6a8717f08e00989e2`, Next.js 16.4.6 com Webpack, build `vXIPy-xX2r6G_Bpqe39Jz`. A alteração desta rodada disponibiliza **Limpar filtros** em Gramática e restaura `sort=position`, `order=asc` e página 1.
- Backend `integration/full-recovery` a partir de `da77efe956c384524281c51c16c71709d6a87a92`, compilado com `tsconfig.build.json`. O Swagger descreve `study` e `review` separadamente e inclui os campos dos detalhes e das respostas de revisão. A criação e a avaliação de sessões aceitam Kanji e Vocabulário. As respostas de histórico preservam a representação legada `sentence`.
- As duas cópias continham alterações locais. A relação de arquivos, os hashes de conteúdo, o identificador de build do Next.js e o hash do JavaScript compilado estão no [manifesto da versão candidata](output/playwright/homologacao-2026-11-23/versoes.json).
- A API candidata rodou em modo de produção na porta `3305`. O frontend rodou na porta `3306`. PostgreSQL 16 e Redis 7 descartáveis, com 17 migrações aplicadas em base vazia. Foram usados 286 pontos publicados do seed do repositório, 40 exemplos desse seed, um ponto oculto, 30 kanjis, 30 vocábulos e quatro contas descartáveis.
- As execuções no navegador usaram Edge 158 e Firefox 159 em desktop. As medidas de 320 e 390 CSS px foram emuladas. As simulações registradas na tabela foram interceptações do navegador. Os fluxos de gravação, isolamento e permissões usaram a API candidata e o PostgreSQL de homologação.

## Matriz da regressão

| ID e cenário | Perfil e execução | Resultado esperado | Resultado observado | Status |
| --- | --- | --- | --- | --- |
| 1 · Catálogo de Kanji | Visitante · Edge + API | Itens e faixa iguais à consulta | 24 IDs em ordem idêntica à API. Faixa 1–24 e total 30. | Aprovado |
| 2 · Busca Kanji e resposta atrasada | Visitante · Edge + API com atraso simulado | Cruza busca, JLPT e ordem. A última resposta prevalece. | A consulta enviou N5 e `strokes desc`. A resposta atrasada para 日 não substituiu os IDs da consulta mais recente por 火. | Aprovado |
| 3 · Paginação, vista e limpeza | Visitante · Edge + API | Página 2, troca visual local e retorno aos padrões | Página 2 coincidiu com a API. Espaço alternou para lista sem GET. Limpar voltou à página 1, `frequency asc`, sem busca e JLPT. | Aprovado |
| 4 · Filtros pessoais de Kanji | Visitante · Edge + API | Orientar login e preservar catálogo público | Dominados, Favoritos e Suspensos ficaram desabilitados. Mesmo inseridos na URL, os parâmetros pessoais ficaram fora da chamada. Total público 30. | Aprovado |
| 5 · Detalhe de Kanji | Visitante · Edge + API | Mesmo conteúdo por clique, URL direta e recarga | O detalhe de 日 mostrou significado e exemplo 日本 iguais à API nas três entradas. | Aprovado |
| 6 · Voltar de Kanji | Visitante · Edge + API | Restaurar filtros, ordenação, página, modo e card visível | A volta pelo botão após recarga e pelo histórico preservou seis parâmetros, os IDs e o card no viewport. | Aprovado |
| 7 · Kanji inexistente | Visitante · Edge + API | 404 amigável e retorno | A API retornou 404. O Edge apresentou **Kanji indisponível** e voltou ao catálogo sem mostrar o JSON. | Aprovado |
| 8 · Disponibilidade de áudio | Visitante · Edge + arquivo local | Controle presente quando houver fonte | Sem controle nos detalhes sem URL. No vocabulário com WAV, o botão apareceu e iniciou reprodução. | Aprovado |
| 9 · Estudar Kanji | Student · Edge + API com atraso simulado | Enviar `study` uma vez e persistir | Botão desabilitado enquanto pendente. Um POST 200. Item presente na biblioteca e no detalhe após recarga. | Aprovado |
| 10 · Atalho de revisão de Kanji | Student · Edge + API | Navegar para fila e gravar ao avaliar | **Fila de revisão** no card e no detalhe abriu `/dashboard/review` sem POST de progresso ou avaliação. A avaliação explícita foi verificada no 23. | Aprovado |
| 11 · Consulta de Vocabulário | Visitante · Edge + API | Busca e N5, duas ordens e página 2 coerentes | Busca × N5 retornou total 25. Frequência ascendente e descendente e IDs da segunda página coincidiram com a API. | Aprovado |
| 12 · Detalhe de Vocabulário | Visitante · Edge + API | Abrir por card com significado, nota e estado sem exemplos | **Ver detalhes** abriu a rota dedicada. Nota e significado corresponderam ao payload. A tela mostrou **Sem exemplos cadastrados**. | Aprovado |
| 13 · Tag de Vocabulário | Visitante · Edge + API | Contagem, faixa e escopo correspondem à página | A tag `referência` mostrou 10 de 20 cards na página 1 e 5 de 10 na página 2. Faixas 1–20 e 21–30 de 30. O rótulo indica **Tag nesta página**. | Aprovado |
| 14 · Vocabulário por teclado | Visitante · Edge + API | Tab e Enter abrem o vocábulo sem gravar progresso | Tab chegou a **Ver detalhes de 日語**. Enter abriu o item correto e não disparou POST de estudo ou avaliação. | Aprovado |
| 15 · Atalho de revisão de Vocabulário | Student · Edge + API | Navegar sem avaliação implícita | **Fila de revisão** abriu a fila geral pelo card e pelo detalhe. A avaliação foi enviada apenas depois de revelar e responder ao card no 23. | Aprovado |
| 16 · Estados de progresso | Visitante e Student · Edge + API e 503 simulado | Distinguir visitante, ausência, zero e erro | Cards e detalhes dos três módulos indicaram login para visitante. Student viu mensagens de ausência e valores zero distintos, conferidos com a API. O 503 exibiu **Tentar novamente**. | Aprovado |
| 17 · Filtros de Gramática | Visitante · Edge + API | Combinar filtros e limpar para a ordenação padrão | Aplicou busca, N5, dificuldade 1 e `difficulty desc`. **Limpar filtros** removeu os filtros e enviou `position asc`. | Aprovado |
| 18 · Gramática vazia | Visitante · Edge + API e simulação | Mensagens distintas para catálogo sem conteúdo e busca vazia | Busca sem correspondência usou a API e recuperou conteúdo ao limpar. Resposta simulada de catálogo sem publicações mostrou mensagem própria sem instrução de seed. | Aprovado |
| 19 · Detalhe de Gramática | Visitante · Edge + API | Acesso por teclado e leitura em tela estreita | Tab e Enter abriram です. Explicação longa, exemplo e nota apareceram. Documento e viewport com 320 px de largura. | Aprovado |
| 20 · Estudar Gramática | Student · Edge + API | `study` confirma e persiste estudo | POST `study` 200, `isStudied=true`, aviso de sucesso e estado **Estudado** após recarregar. | Aprovado |
| 21 · Revisar Gramática | Student · Edge + API e falhas simuladas | Enviar a confiança escolhida, recuperar falhas e persistir | A escolha 4 enviou `{"action":"review","understood":true,"confidenceLevel":4}`. Os 400 e 503 simulados mantiveram o valor. A API real retornou 200, confiança 4 e uma revisão a mais, confirmadas na recarga. A omissão da confiança na API real retornou 400. | Aprovado |
| 22 · Nova tentativa nos catálogos | Visitante e Student · Edge + API e 503 simulado | Repetir parâmetros e mostrar carregamento | Kanji, Vocabulário e Gramática recuperaram a página 2 com parâmetros idênticos. Na página 1 os três preservaram N5 e alternaram `aria-busy` de true para false após o 200. | Aprovado |
| 23 · Sessão de revisão | Student · Edge + API e 503 simulado | Um envio, recarga, recuperação de stats e abandono | O duplo clique não duplicou a avaliação. F5 retomou o segundo card. Repetir stats após 503 não reenviou `/answer`. Abandono conservou o card na fila. | Aprovado |
| 24 · Contador global | Dois Students · Edge + API | Atualização sem recarregar e isolamento | Barra 3→2→1→0 após as respostas. Logout retirou o contador e a segunda conta recebeu seu próprio total de 1. | Aprovado |
| 25 · Cinco rotas privadas | Visitante · Edge | Tela de entrada e nenhuma leitura privada | Dashboard, Estudo, Revisão, Planner e Imersão exibiram o estado de entrada sem chamar dados privados. | Aprovado |
| 26 · Login Admin direto | Visitante · Edge + API | Preservar `next` e recusar leituras | As três rotas administrativas incluíram caminho e consulta em `next`. As três leituras administrativas da API retornaram 401. | Aprovado |
| 27 · Controles Admin de Kanji | Visitante, Student, Teacher e Admin · Edge | Exibir Editar e Admin apenas para Admin | O mesmo detalhe escondeu os controles para visitante, Student e Teacher. Admin viu Editar e Admin. | Aprovado |
| 28 · Renovação rejeitada | Student · Edge + API com sessão de teste invalidada | API recusa ação e renovação. Catálogo continua acessível. | Credencial da ação invalidada e cookie removido no teste. API real respondeu 401 e 401. Sessão voltou a Convidado e o catálogo abriu. | Aprovado |
| 29 · Formulários vazios | Visitante · Edge | Validar os três formulários antes da API | Login, Registro e Login Administrativo bloquearam o envio vazio. Login Administrativo usou validação nativa do navegador. | Aprovado |
| 30 · Sessão e administração | Visitante, Student, Teacher e Admin · Edge + API | Renovar sessão, aplicar perfis e permitir CRUD administrativo | Login e renovação 200 para os perfis autenticados. Logout 200. Visitante 401, Student e Teacher 403 nas leituras, Admin 200. Nos três módulos, Teacher recebeu 403 ao criar e Admin recebeu 201, 200 e 204 no CRUD. | Aprovado |
| 31 · Estudo, revisão e isolamento | Dois Students · Edge + API | Persistir progresso próprio, aplicar vencimento e proteger sessões | Progresso isolado nos três módulos, futuro fora da fila, sessão alheia 404 e resposta concorrente idempotente. A barra zerou quando o último card foi respondido no Edge. | Aprovado |
| 32 · Gramática publicada | Visitante e Student · Edge + API | Publicações disponíveis, paginação sem duplicatas e ocultos excluídos | 286 publicados no seed candidato. Duas páginas de 20 com 40 IDs distintos. Busca, filtros e detalhe abriram no Edge. O oculto retornou zero na busca e 404 no detalhe. | Aprovado |
| 33 · Analytics privado | Visitante · Edge | Entrada sem consulta privada | A tela de entrada apareceu e não houve `GET /analytics/overview`. | Aprovado |
| 34 · Tutor de demonstração | Visitante · Edge | Identificar demonstração e responder localmente | O Tutor mostrou a pergunta e a resposta de exemplo. Nenhuma chamada à API foi disparada após o envio. | Aprovado |
| 35 · Busca global | Visitante · Edge | Botão e atalho abrem busca de páginas e ações | Botão e `Ctrl+K` abriram a paleta. Placeholder e estado vazio indicaram o escopo. **Abrir fila de revisão** navegou para Revisão. | Aprovado |
| 36 · Larguras móveis | Visitante · Edge | Três catálogos e detalhe de Kanji sem exceder viewport | As quatro páginas mediram 390/390 e 320/320 CSS px de largura do documento e viewport. | Aprovado |
| 37 · Nomes e idiomas | Visitante · Edge e Firefox | Nomes de controles, estado de Grade/Lista e idiomas | Busca, JLPT, Dominados, Favoritos, Suspensos, Ordenar por e Ordem tiveram nome acessível. Grade/Lista expuseram `aria-pressed` e responderam a Espaço. Busca global, Revisar e notificações tiveram nome. `pt-BR` no HTML e `ja` nos termos. | Aprovado |
| 38 · URL direta de Vocabulário e Gramática | Visitante · Edge + API | Abrir, recarregar e voltar | As duas URLs abriram o detalhe, mantiveram o conteúdo após F5 e retornaram ao catálogo. | Aprovado |
| 39 · Reprodução efetiva | Visitante · Edge + arquivo local | Tocar, pausar e informar falha | WAV 200, reprodução e pausa por Enter/Espaço. A fonte 404 exibiu mensagem legível. | Aprovado |
| 40 · Swagger servido | Visitante e perfis autenticados · API | Esquemas, parâmetros, autenticação e exemplos correspondem ao contrato | `/docs-json` descreve os três corpos condicionais e as respostas de progresso, lista e detalhe. Gramática expôs `difficulty` e `tag`, Kanji aceitou visitante e sessão. Fila, contagem, criação, resposta, leitura, histórico, stats, encerramento e abandono foram comparados aos schemas servidos. Entradas inválidas deram 400, sem sessão 401 e respostas divergentes 409. | Aprovado |
| 41 · Dashboard, Planner, Imersão e Analytics | Admin e Teacher · Edge + API | CRUD, metas e métricas reais | Planner criou, editou, concluiu 1/1 com 25 min e excluiu a tarefa. Imersão passou de 35 para 55 min e Analytics retornou 55 min. Dashboard e Analytics abriram no Edge. As duas telas de metas enviaram PUT 200 com `unit` omitida em Kanji e Gramática e `min` preservado em Imersão. | Aprovado |
| 42 · Leitor de tela e cobertura complementar | Visitante nos três catálogos e Student nos filtros de Kanji · Firefox 153.7.0esr + Orca 43.1 | Anunciar títulos, controles e estados e devolver o foco ao link de origem ao voltar | Orca anunciou títulos, filtros, estados e links de detalhes. Em duas passagens por catálogo, **Voltar** restaurou o foco e o Orca anunciou novamente **Ver detalhes** do item de origem. O Tab seguinte continuou pelo catálogo. [Registro por catálogo](#validação-da-correção-do-caso-42-com-orca) | Aprovado no build `I_MPile6KGPanKuoQ1E6t` |
| 43 · Escala SRS de Vocabulário | Student · Edge + API | Nível 5 em 100% e nível intermediário proporcional | API, catálogo e biblioteca concordaram em 5/5 com 100% e 2/5 com 40%. Valores ARIA e largura do indicador conferidos. | Aprovado |

## Validação da correção do caso 42 com Orca

**Ambiente.** 24/11/2026, build de produção `I_MPile6KGPanKuoQ1E6t` com Next.js 16.4.6 e Webpack. Firefox 153.7.0esr, Orca 43.1 e Speech Dispatcher 0.11.4 com eSpeak NG em Debian 12.15, com viewport de 1280 × 900. Os catálogos usaram a API de homologação com PostgreSQL 16 e Redis 7 descartáveis. [Manifesto do build corrigido](output/playwright/homologacao-2026-11-24/caso-42-orca/versoes.json)

Em cada catálogo, Tab chegou ao link do item e Enter abriu os detalhes. O Orca anunciou o título da tela de detalhes e `Voltar visited link.` ao focar **Voltar**. Após Enter, o catálogo carregou com o ID de origem na URL e `document.activeElement` voltou ao link do item nos dois percursos de cada catálogo. Kanji foi testado em Grade e Lista.

| Catálogo | Anúncios dos controles do catálogo | Foco e anúncio após **Voltar** | Primeiro Tab |
| --- | --- | --- | --- |
| Kanji | `Busca entry`, `JLPT combo box.`, `Ordenar por combo box.`, `Ordem combo box.`, `Grade toggle button pressed.` e `Lista toggle button not pressed.` Ao trocar a visão, `Lista toggle button pressed.` Como Student, também `Dominados combo box.`, `Favoritos combo box.` e `Suspensos combo box.` | **Ver detalhes de 日**. `Ver detalhes de 日 visited link.` | **Entrar para estudar e revisar** no próximo card. |
| Vocabulário | `Busca entry`, `JLPT combo box.`, `Tag nesta página combo box.`, `Ordenar por combo box.` e `Ordem combo box.` | **Ver detalhes de 日語**. `Ver detalhes de 日語 visited link.` | **Entrar para estudar e revisar** no próximo card. |
| Gramática | `Busca entry`, `JLPT combo box.`, `Dificuldade combo box.`, `Ordenar por combo box.`, `Ordem combo box.` e `Filtrar por tag qa-grammar toggle button not pressed.` | **Ver detalhes de です**. `Ver detalhes de です visited link.` | **Ver detalhes de も**, anunciado como `Ver detalhes de も link.` |

[Anúncios do Orca](output/playwright/homologacao-2026-11-24/caso-42-orca/anuncios-orca.txt) · [Percursos por catálogo](output/playwright/homologacao-2026-11-24/caso-42-orca/percursos.json) · [Repetição do retorno e filtros pessoais](output/playwright/homologacao-2026-11-24/caso-42-orca/confirmacoes.json)

## Reexecução do caso 42 com Orca em 23/11/2026

**Ambiente.** 23/11/2026, Debian GNU/Linux 12.15 em contêiner, Firefox 153.7.0esr (Gecko), Orca 43.1 e Speech Dispatcher 0.11.4 com eSpeak NG, viewport de 1280 × 900. As falas são transcritas da saída do Orca enviada ao sintetizador. O leitor usou termos de controle em inglês e anunciou os rótulos exibidos pela aplicação. [Guia do Orca](https://help.gnome.org/orca/introduction.html.pt_BR)

**Candidato.** Frontend `3cC1Chgu_DAylFte_8yuu`, base `021c040`, com Next.js 16.4.6 e Webpack. Backend base `da77efe`, SHA-256 do JavaScript compilado `872a4d877c95e7d424a5b960a35900ff9570eb572afcdc9e9a14c1cbfff7dc74`, com PostgreSQL e Redis de homologação. O build original retornou HTTP 500 ao solicitar parte dos chunks antigos. A reexecução usou o build de produção com as alterações posteriores de revisão e biblioteca. [Manifesto do candidato testado](output/playwright/homologacao-2026-11-23/caso-42-orca/versoes.json)

| Percurso | Passos e anúncios do leitor de tela |
| --- | --- |
| Kanji | `Ctrl+Home` e `1` anunciaram `Banco de Kanji heading level 1.` Tab passou por `Busca entry`, `JLPT combo box.`, `Ordenar por combo box.` e `Ordem combo box.` A sessão Student anunciou também `Dominados combo box.`, `Favoritos combo box.` e `Suspensos combo box.` O seletor anunciou `Grade toggle button pressed.` e `Lista toggle button not pressed.` Espaço mudou a visualização e o Orca anunciou `Lista toggle button pressed.` O leitor identificou `Ver detalhes de 日 link.` |
| Vocabulário | `Vocabulário heading level 1.`, `Busca entry`, `JLPT combo box.`, `Tag nesta página combo box.`, `Ordenar por combo box.` e `Ordem combo box.` O leitor identificou a ação `Ver detalhes de 日語 link.` |
| Gramática | `Gramática heading level 1.`, `Busca entry`, `JLPT combo box.`, `Dificuldade combo box.`, `Ordenar por combo box.`, `Ordem combo box.` e `Filtrar por tag qa-grammar toggle button not pressed.` O leitor identificou `Ver detalhes de です link.` |
| Detalhes | Enter abriu os detalhes de 日, 日語 e です. A navegação por título (`1`) anunciou `Detalhe do Kanji heading level 1.`, `Detalhe do vocabulário heading level 1.` e `Detalhe da gramática heading level 1.` Com a seta para baixo foram lidos, em ordem, o subtítulo, os controles, o termo como título de nível 2 e os metadados. Nos detalhes de vocabulário e gramática, apareceram também `Significados e usos heading level 3.` e `Formação e uso heading level 3.` Tab anunciou `Voltar visited link.` e Enter ativou o retorno. |

O percurso de retorno foi repetido duas vezes por catálogo como visitante. Em cada passagem, foi usado Tab para chegar a **Ver detalhes**, Enter para abrir, Tab para chegar a **Voltar** e Enter para retornar. O foco ativo (`document.activeElement`) foi registrado após o retorno e após pressionar Tab pela primeira vez.

| Catálogo | Link de origem esperado | Foco após ativar **Voltar** | Primeiro Tab e anúncio do Orca |
| --- | --- | --- | --- |
| Kanji (`日`) | **Ver detalhes de 日** | `body` em `/dashboard/kanji`, com `item=qa-k-0` na URL em ambas as passagens. A primeira também preservou `view=list`. | Link do logotipo (`/dashboard`). `日 Fluency OS 日本語 link.` |
| Vocabulário (`日語`) | **Ver detalhes de 日語** | `body` em `/dashboard/vocab`, com `item=qa-v-0` na URL em ambas as passagens. | Link do logotipo (`/dashboard`). `日 Fluency OS 日本語 link.` |
| Gramática (`です`) | **Ver detalhes de です** | `body` em `/dashboard/grammar`, com `item=qa-N5-001` na URL em ambas as passagens. | Link do logotipo (`/dashboard`). `日 Fluency OS 日本語 link.` |

**Resultado em 23/11/2026.** Caso 42 reprovado no build `3cC1Chgu_DAylFte_8yuu` por perda de foco no retorno.

[Anúncios do Orca](output/playwright/homologacao-2026-11-23/caso-42-orca/anuncios-orca.txt) · [Percursos por módulo](output/playwright/homologacao-2026-11-23/caso-42-orca/percursos.json) · [Repetição do retorno e filtros pessoais](output/playwright/homologacao-2026-11-23/caso-42-orca/confirmacoes.json)

## Critérios do plano geral

| ID | Resultado observado | Status |
| --- | --- | --- |
| WEB-04 | Com relógio de homologação em `America/Sao_Paulo`, às 23h59 de 06/12 o Planner apresentou 1 tarefa de domingo e 0 concluídas. Às 00h01 de 07/12 apresentou 2 tarefas de segunda, 1 concluída e 12 minutos. Datas, marcação do dia e contadores coincidiram em `/planner/overview` e `/planner/summary/today`. | Aprovado |
| SRS-01 / SRS-02 | Respostas simultâneas idênticas na mesma sessão retornaram o mesmo resultado 200 e criaram só uma avaliação, em Kanji e Vocabulário. Em duas sessões concorrentes para o mesmo card, as duas avaliações válidas serializaram a atualização e elevaram `totalReviews` em 2. O teste de integração também cobriu concorrência e encerramento repetido. | Aprovado |
| GRA-03 | Busca do item oculto com total 0, detalhe 404 e POSTs `study` e `review` 404. | Aprovado |
| Inicialização | `/health/ready` 200 com PostgreSQL e Redis prontos. Três leituras autenticadas sequenciais de `/dashboard/summary` retornaram 200. O limite de 100 requisições por minuto permaneceu ativo. Houve 429 durante a exploração inicial em paralelo e a regressão foi retomada em lotes espaçados. | Aprovado |

## Verificações automatizadas e evidências

- Frontend com 40 testes aprovados, TypeScript sem erros, lint com seis avisos e zero erros e build de produção aprovado.
- Backend com build de produção, lint, 285 testes unitários e 111 testes de integração aprovados.
- [Execuções no navegador](output/playwright/homologacao-2026-11-23/navegador.json), [respostas e verificações da API](output/playwright/homologacao-2026-11-23/api.txt) e [documento OpenAPI servido pelo candidato](output/playwright/homologacao-2026-11-23/swagger-candidato.json).

## Revalidação da branch em 24/11/2026

O código em `13e3369`, sobre a base `021c040`, passou em 42 testes, TypeScript e build de produção `C0qZclvKoi8mptMWVkES7`. O lint terminou com seis avisos e zero erros. As evidências acima preservam a rodada anterior de 43 cenários e a validação do foco com Orca.

A comparação com os builds-base confirmou que as rotas diretas de Vocabulário e Gramática devolviam 404 e a busca de Kanji não tinha o nome acessível **Busca**. Na reexecução com Edge, os três catálogos repetiram a consulta da página 2 com o filtro N5 após um 503 simulado. Cada detalhe abriu pelo teclado, manteve o conteúdo após recarga e devolveu o foco ao link original. As três telas couberam em 320 e 390 CSS px. A paleta abriu com `Ctrl+K` e levou à tela de entrada da Revisão para o visitante.

Com a conta de estudante, a biblioteca exibiu o nível SRS 5/5 com a barra completa. O duplo clique enviou uma avaliação, a recarga retomou o segundo card e a nova tentativa de estatísticas após um 503 manteve os dois envios já confirmados. A barra atualizou a fila de 2 para 1 e depois para 0.
