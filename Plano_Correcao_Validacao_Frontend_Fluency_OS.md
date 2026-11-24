# Fluency OS — Plano de correção e validação do frontend

Corrija primeiro as jornadas de estudo, revisão, recuperação de tela e acesso. Depois, alinhe busca, contadores e progresso. Aplique o padrão visual de Kanji a Vocabulário e Gramática em mudanças separadas, com validação no navegador a cada entrega.

Os resultados da rodada de fechamento e a decisão de liberação estão na [matriz de homologação atualizada](Matriz_Fechamento_Homologacao_Fluency_OS.md).

**Ponto de partida.** A auditoria de frontend de 23/11/2026 registrou **43 cenários**. Foram **17 aprovados, 19 com falha, quatro bloqueados, um não executado e dois não aplicáveis** naquela rodada. Consultas públicas e alguns bloqueios foram testados na instância local real. Os fluxos de gravação no navegador foram interceptados. Os payloads capturados para Kanji e Gramática foram rejeitados separadamente pelo validador real do backend. Na data da auditoria, a execução das correções e das validações ainda estava pendente.

## Ordem de execução

| Etapa | Entrega | Condição de aceite |
| --- | --- | --- |
| 0 · Preparar QA | Registrar versões, reproduzir sintomas e preparar contas e dados descartáveis. | Cada falha tem uma reprodução atual ou evidência de que já foi resolvida. Há dados para os fluxos bloqueados. |
| 1 · Estudo e revisão | Corrigir ações dos três módulos e documentar os contratos. | Ações e rótulos correspondem às gravações. Persistência, agendamento e fila foram conferidos com a API real. |
| 2 · Recuperação e acesso | Corrigir novas tentativas, feedback, sessão e permissões. | O usuário recupera a tela após uma falha. Cada perfil vê e executa as ações previstas. |
| 3 · Estado e consistência | Restaurar o contexto do catálogo, corrigir tags, progresso e contagem da fila. | Lista, detalhe, biblioteca e barra superior representam os mesmos dados da API e preservam o contexto de navegação. |
| 4 · Acessibilidade e padrão visual | Corrigir teclado e celular. Aplicar a referência de Kanji a Vocabulário e Gramática. | As rotas funcionam por teclado e em tela estreita. O padrão comum preserva as funções próprias de cada módulo. |
| 5 · Controles e mensagens | Ajustar áudio, catálogo vazio, busca global e elementos demonstrativos. | Cada controle oferece a ação que anuncia, e cada estado orienta o próximo passo disponível. |
| 6 · Homologação | Reexecutar a matriz de frontend com os builds candidatos. | Falhas encerradas com evidência, fluxos reais aprovados e regressão registrada. |

Faça mudanças pequenas, com commits por correção ou grupo de correções dependentes. Separe contrato da API, comportamento do frontend e composição visual quando possível. Para fechar cada etapa, confira a reprodução inicial, o aceite e os fluxos vizinhos que usam o mesmo componente ou endpoint. Uma dependência bloqueada impede o aceite do fluxo afetado. Correções independentes podem continuar em mudanças próprias.

## Etapa 0 · Preparar QA

- Registre branch, SHA dos dois repositórios e ambiente. Rode os scripts existentes de lint, checagem de tipos e testes para obter a referência inicial. Registre como os builds candidatos serão gerados.
- Prepare homologação isolada com as dependências reais dos repositórios. Use visitante, duas contas `STUDENT` independentes, uma `TEACHER` e uma `ADMIN`. Separe registros descartáveis para CRUD e dados conhecidos de Dashboard, Planner, Imersão e Analytics.
- Inclua itens com e sem progresso, card SRS vencido e card agendado para o futuro, tags de Vocabulário distribuídas em mais de uma página e Gramática publicada suficiente para exercitar a paginação real. Inclua um item de Gramática oculto.
- Reproduza os 19 cenários com falha ou registre a diferença em relação à versão auditada. Anote contagens, payloads sem dados sensíveis e o estado de tela em desktop e celular.
- Cruze as dependências de revisão e publicação com os IDs SRS e GRA do plano geral. Confira o estado atual antes de abrir correções duplicadas. As jornadas já planejadas de Planner, Imersão e Dashboard devem ser vinculadas à homologação desta entrega.

## Etapa 1 · Estudo, revisão e contrato

| Cenários | Correção proposta | Validação |
| --- | --- | --- |
| **10 e 15** · Kanji e Vocabulário | Mapeie os botões do card e do detalhe aos endpoints de progresso. Mantenha **Estudar** ligado a `study`. Recomendo que **Revisar** abra o fluxo de sessão e que a avaliação só seja gravada após uma resposta do estudante. Se o atalho abrir a fila geral, deixe o destino claro e respeite a elegibilidade do item. O rótulo **Enviar para Review** precisa mudar se a operação grava um acerto imediato. | Abrir a revisão não grava acerto. Responder grava uma avaliação e altera o agendamento conforme a regra real. Cubra item novo, já estudado, vencido e agendado para o futuro. Estudar um item agendado para depois pode manter a fila atual vazia. |
| **21** · Gramática | Resolva o descompasso entre DTO e service. Para manter a ação **Entendi**, recomendo permitir a omissão de `confidenceLevel` no ramo de revisão em que o service calcula a confiança com base em `understood`. Valide os limites existentes quando um nível for enviado e os campos exigidos por ação. Se a decisão for avaliação explícita, colha o nível na interface. | Valide revisão, estudo, entradas inválidas, confiança retornada e número de revisões após recarga. Confira a regra de publicação do item. A revisão de compreensão segue o contrato de Gramática, e a fila global reflete os tipos atendidos pelo service. |
| **40** · Swagger/OpenAPI | Documente os três payloads de progresso, as respostas de detalhe e revisão, inclusive fila, e os erros. Inclua campos condicionais, autenticação opcional em `GET /kanji` e `difficulty` e `tag` em Gramática. Cruze o enum da sessão de revisão com os tipos atendidos, conforme o plano geral. | Confira o `/docs-json` gerado pelo candidato. Passe exemplos válidos e inválidos pelos DTOs. Compare o resultado e as respostas reais com a documentação e com as chamadas do frontend. Em mudança de contrato, homologue as versões que serão publicadas juntas. |

Repita **9, 20 e 23** para confirmar estudo, retomada de sessão, envio único, encerramento e abandono. Use os testes de concorrência e idempotência do plano geral para fechar a validação real de revisão do **31**.

## Etapa 2 · Recuperação, sessão e acesso

| Cenários | Correção proposta | Validação |
| --- | --- | --- |
| **22** · Nova tentativa nos três catálogos | Faça **Tentar novamente** e **Atualizar** consultarem a página atual com os mesmos parâmetros. A nova consulta precisa funcionar quando a página já é 1. Preserve a proteção contra respostas atrasadas. | Após falha e restauração da conexão, o clique gera uma nova chamada com busca e filtros intactos. Repita na página 1 e em outra página. Em respostas fora de ordem, vence a consulta mais recente. |
| **7 e 21** · Feedback de erro | Renderize uma mensagem de item indisponível e Voltar no 404 de Kanji. Garanta que o mecanismo de notificações usado pelos fluxos esteja montado. Mostre erros de gravação e permita nova tentativa sem descartar o estado necessário. | Abra um ID inexistente. Force 400 e falha transitória na gravação. Confira mensagens legíveis, anunciadas quando apropriado, possibilidade de nova tentativa e confirmação de sucesso dependente da resposta da API. |
| **4 e 27** · Controles e perfil | Editar/Admin de Kanji ficam disponíveis para `ADMIN`. Para visitantes, Estudar, Revisar e filtros pessoais devem indicar a necessidade de sessão e oferecer um caminho de login onde aplicável. Resolva a sessão antes de liberar ações pessoais ou administrativas. Preserve middleware e guards. | Compare visitante, sessão sendo restaurada, sessão expirada, `STUDENT`, `TEACHER` e `ADMIN`. Teste controles, rotas diretas e resposta da API. Confirme 401 sem sessão, a recusa esperada para perfis comuns e CRUD com Admin. |
| **33** · Analytics privado | Aplique o fluxo de entrada das demais telas privadas. Consulte `GET /analytics/overview` depois de resolver a identidade. Descarte dados da conta anterior em logout ou troca de usuário. | Visitante recebe a tela de entrada sem requisição privada. Login, recarga direta e renovação mostram os dados da conta certa. Se a renovação falhar, a sessão é limpa. |

Repita **25, 26, 28 e 29**. Feche o **30** em homologação com contas reais. Na administração de Kanji e Vocabulário, confira se as leituras públicas entregam campos e filtros necessários ao operador. Se houver lacuna ou exigência de contrato administrativo, migre a leitura em uma entrega própria e revalide listagem, paginação e CRUD. Gramática já usa leituras administrativas.

## Etapa 3 · Estado e consistência

| Cenários | Correção proposta | Validação |
| --- | --- | --- |
| **6** · Voltar do detalhe de Kanji | Preserve busca, filtros, ordenação, página, modo grade/lista e a posição útil da navegação. Defina um retorno padrão ao catálogo para quem abrir o detalhe diretamente. | Busque, filtre, avance de página, troque o modo, abra um item e volte. Confira o conjunto e o card visível pelo botão da tela e pelo histórico do navegador. Repita após recarregar o detalhe e em acesso direto. |
| **13** · Tag de Vocabulário | Recomendo filtrar o conjunto inteiro. Confirme o suporte da API e, se precisar estender o contrato, aplique o filtro antes da contagem e paginação. As opções devem representar o escopo anunciado. Enquanto o filtro for local, identifique esse escopo e faça o contador descrever os cards da página. | Distribua uma tag por páginas diferentes. Combine tag, busca e JLPT. Confira itens, total, faixa e páginas. Teste limpeza e troca de tag e compare a consulta sem tag com a versão anterior. |
| **16 e 43** · Progresso e escala | Distinga visitante, carregamento, item sem registro, nível zero registrado, progresso acima de zero e falha. Alinhe a escala SRS no catálogo e na biblioteca. Em Gramática, use confiança e revisões. Indique se cada contador representa a consulta, a página ou a conta. | Compare card, detalhe e biblioteca com e sem `userProgress`. Cubra nível zero quando válido e nível máximo. Em Vocabulário, nível 5 preenche 100%. Teste falha, filtragem, paginação e troca de conta. |
| **24** · Contador global de revisão | Consulte novamente `GET /review/queue/count` após ações confirmadas que possam mudar a fila. Atualize fila, revisão e barra superior pela fonte real. Separe a recuperação de `stats` das gravações já confirmadas. | Após responder ao último card vencido, fila e contador chegam a zero sem recarga. Repita com cards restantes, retomada, abandono, erro em `stats` e troca de conta. Confira o mesmo valor após recarregar. |

Repita **1–3, 5, 9, 11, 12, 17, 19, 20 e 23**. Use duas contas reais para confirmar isolamento no cenário **31**.

## Etapa 4 · Acessibilidade e identidade visual

### 4A · Corrigir barreiras existentes

- **14:** use um botão semântico para abrir o detalhe de Vocabulário, com estado de expansão e associação ao conteúdo. Preserve os controles independentes de estudo e revisão. Valide abertura e fechamento por teclado, além do foco.
- **36:** contenha a decoração do `DashboardShell` em sua área. Confirme a largura e a visibilidade dos controles nos três catálogos e no detalhe de Kanji. Use os **390 × 844** da auditoria e uma largura menor.
- **37:** dê nomes persistentes aos filtros e nomes acessíveis aos controles de ícone. Exponha a seleção de grade/lista e o estado expandido do acordeão. Declare `lang="pt-BR"` na interface e `lang="ja"` no conteúdo japonês. Teste Tab, Enter e Espaço onde aplicáveis, foco visível e contraste dos controles nas superfícies usadas.

### 4B · Aplicar a referência de Kanji

Use as duas imagens e os componentes existentes. Faça a primeira adoção em **Vocabulário**, valide Kanji e Vocabulário e só então aplique o padrão a **Gramática**. Compartilhe a apresentação recorrente e preserve o comportamento e os dados de cada módulo, inclusive as entradas atuais de detalhe.

| Bloco | Regra comum | Vocabulário | Gramática |
| --- | --- | --- | --- |
| Catálogo | Cabeçalho, indicadores com escopo explícito e barra de busca e filtros. | Busca, JLPT, tag e ordenação. | Busca, JLPT, dificuldade e ordem didática. |
| Card | Nível quando disponível, japonês em destaque, informação principal, metadados, progresso e ações em posições previsíveis. | Palavra inteira, leitura, significado, classe e frequência quando disponíveis. | Estrutura japonesa, uso principal, formação ou dificuldade quando disponíveis. |
| Detalhe | Identidade, informações e progresso em destaque. Exemplos e informações complementares ao lado em telas largas e abaixo no celular. | Leituras, significados, usos, notas e exemplos com espaço para ler o termo completo. | Formação, explicação, contexto e exemplos, preservando o gatilho acessível do acordeão. |
| Tema e interação | Reutilizar cartões, bordas, chips, botões, foco, tipografia japonesa e cores adotadas em Kanji. | Estados consistentes de estudo, revisão e erro. | Mesma apresentação de progresso, usando confiança e revisões de compreensão. |

**Aceite.** Compare desktop e celular com conteúdo longo, campos ausentes e exemplos. Repita busca, filtros, detalhe, estudo e revisão por teclado e por clique. Confira grade/lista e detalhe de Kanji, detalhe inline de Vocabulário e acordeão de Gramática. No **42**, registre segundo navegador, leitor de tela e dispositivos ou larguras exercitados.

## Etapa 5 · Controles e mensagens

| Cenários | Correção proposta | Validação |
| --- | --- | --- |
| **8** · Áudio | Mostre controle quando houver fonte compatível e ação de reprodução. Em Kanji, retire o botão dos exemplos sem fonte. Em Vocabulário, implemente reprodução de `audioUrl` suportada ou ajuste a indicação até existir player. | Confira casos sem fonte e com fonte. Se houver player na entrega, inclua reprodução efetiva, teclado e falha de carregamento no cenário **39**. |
| **18** · Gramática vazia | Diferencie catálogo sem publicações, filtro sem resultados e erro de leitura. Ofereça limpar filtros quando fizer sentido. Retire a instrução de seed da área do estudante. | Teste os três estados e um catálogo preenchido. Use registros publicados reais para comprovar paginação e detalhe no **32**. |
| **35** · Busca global | Atualize o texto da paleta `Ctrl+K` para descrever a busca de navegação e comandos feita hoje. | Abra por atalho e pelo botão, encontre um comando existente e confirme que os textos descrevem o escopo observado. |
| **34 e achados complementares** · Controles inativos e demonstrações | Identifique o Tutor como demonstração. Revise Tutor/Discussão de Gramática, sino e lua em busca de ações sem handler. Represente indisponibilidade com clareza. Identifique o heatmap aleatório como demonstrativo ou retire a visualização até haver dados reais. | Confira se os controles acionáveis respondem, se a demonstração está indicada e se a apresentação do Dashboard corresponde à origem dos dados. |

Pesquisa global de conteúdo e links diretos para Vocabulário ou Gramática são melhorias opcionais após a estabilização. Se uma URL pública de detalhe entrar em escopo, transforme o **38** em teste de acesso direto, recarga e retorno ao catálogo.

## Etapa 6 · Homologação e liberação

Feche os quatro cenários bloqueados com a API real em homologação.

| Cenário | Evidência necessária |
| --- | --- |
| **30** · Autenticação e administração | Login, renovação, logout, acesso administrativo por perfil e CRUD de Kanji, Vocabulário e Gramática com registros descartáveis. |
| **31** · Estudo, revisão e isolamento | Duas contas independentes. Gravar e recarregar progresso nos três módulos. Conferir agendamento, fila, sessão e contadores onde aplicáveis. Confirmar que cada conta recebe os próprios dados. |
| **32** · Gramática publicada | Listar, buscar, paginar e abrir detalhe com dados publicados reais. Confirmar totais e exclusão de itens ocultos da consulta pública. |
| **41** · Dashboard, Planner, Imersão e Analytics | Criar, editar, concluir e excluir tarefas de teste conforme os fluxos existentes. Validar metas, gravar e editar logs e comparar resumos e métricas com a API. Vincular as correções previstas no plano geral. |

Reexecute os **43 cenários** na matriz candidata. Exija evidência para fechar as **19 falhas**. Os **17 aprovados** formam a regressão, incluindo o **15**, cujo aceite passa a refletir a operação acordada na etapa 1. Feche os **quatro bloqueados**, registre a cobertura obtida no **42** e reclassifique **38 e 39** conforme o escopo efetivamente entregue.

Rode lint, checagem de tipos, suítes existentes e builds conforme a área alterada. Na homologação, use builds de produção e a API real para percorrer as jornadas de login, catálogos, detalhe, Estudo, revisão, administração e telas pessoais. Simulações complementam estados de falha e recuperação. Persistência, permissões e isolamento exigem evidência real.

| Caso | Versões, ambiente e perfil | Esperado | Observado | Evidência | Status |
| --- | --- | --- | --- | --- | --- |
| 22 · Exemplo | A preencher | Após restaurar a rede, o botão emite nova consulta com os filtros atuais. | A preencher | Requisição e estado após o clique | Pendente |

**Critério de liberação.** Os cenários aplicáveis passam, as suítes e builds da versão candidata passam e frontend, backend e Swagger estão compatíveis. Regressões de permissão, gravação de progresso ou sessão de revisão bloqueiam a liberação. Se uma mudança falhar, reverta o menor conjunto de commits necessário, respeitando a compatibilidade dos contratos. Para uma eventual migração vinculada ao plano geral, use o procedimento de recuperação ensaiado para ela.

### Registro de homologação · 23/11/2026

**Versões e dados.** Frontend `main`, base `021c040`. Backend `integration/full-recovery`, base `da77efe`. Os builds incluem as alterações presentes nas duas cópias de trabalho. O frontend usou o build de produção do Next.js com Webpack e a API compilada com a configuração de produção do TypeScript. A API usou PostgreSQL 16 e Redis 7 descartáveis. Foram aplicadas 17 migrações em uma base vazia. Os dados incluem 286 pontos publicados e 1.140 exemplos copiados para homologação, um ponto oculto de teste, 25 kanjis, 25 vocábulos de referência e quatro contas descartáveis. A consulta à instância principal confirmou 286 pontos publicados.

**Verificações automatizadas.** Frontend com 40 testes aprovados, checagem de tipos aprovada, lint com seis avisos e zero erros e build de produção aprovado. Backend com lint e build aprovados, 285 testes unitários e 111 testes de integração aprovados. `GET /health/ready` da API candidata retornou `200` com PostgreSQL e Redis disponíveis.

| Caso | Evidência da versão candidata | Status |
| --- | --- | --- |
| 30 · Autenticação e administração | Login, renovação após recarga e logout no Edge. O middleware redirecionou estudante e visitante e liberou as três áreas para administrador. Na API, operações administrativas exigiram sessão e perfil ADMIN. CRUD com registros descartáveis passou nos três módulos. | Aprovado |
| 31 · Estudo, revisão e isolamento | Estudo pelos detalhes dos três módulos no Edge, Kanji e Vocabulário na biblioteca e confiança 4 em Gramática. Na API, duas contas viram apenas o próprio progresso. Card vencido na fila e futuro fora da fila. Resposta repetida retornou o mesmo resultado, a sessão da outra conta retornou 404 e o último card levou a contagem de 1 a 0. O Edge retomou uma sessão depois de um 429 no encerramento e concluiu a revisão. Cobertura vinculada a SRS-01 e SRS-02. | Aprovado |
| 32 · Gramática publicada | API retornou total de 286, com 20 itens em cada uma das duas primeiras páginas, sem IDs repetidos. Busca e detalhe de ponto publicado passaram. O ponto oculto retornou total 0 na busca pública e 404 no detalhe. No Edge, busca, paginação e navegação abriram os dados publicados. Cobertura vinculada a GRA-01 e GRA-02. | Aprovado |
| 38 · Detalhes diretos | Edge abriu e recarregou os detalhes de Vocabulário e de Gramática e retornou ao catálogo. O retorno da Gramática preservou o texto da busca. | Aprovado |
| 39 · Áudio | No Chrome, Kanji e Vocabulário sem fonte não exibiram controle de áudio. Um vocábulo descartável com WAV tocou e pausou pelo teclado. Uma fonte HTTP 404 exibiu mensagem de erro. | Aprovado |
| 40 · Swagger/OpenAPI | `/docs-json` publicou os seis esquemas de requisição e resposta de progresso sem propriedades. `GET /grammar` omitiu `difficulty` e `tag`. `GET /kanji` declarou autenticação obrigatória apesar de aceitar visitante. Fila, contagem e respostas de criação e avaliação da sessão não incluíram esquemas de resposta. A API real rejeitou revisão de Gramática sem confiança com 400, aceitou confiança 4 e anunciou os tipos de sessão Kanji e Vocabulário. | Reprovado |
| 41 · Dashboard, Planner, Imersão e Analytics | No Edge, Planner criou, editou, concluiu e excluiu uma tarefa. O Dashboard acompanhou a criação, conclusão e exclusão com a contagem de `GET /planner/overview`. Planner e Imersão salvaram metas após a correção do cliente e a recarga recuperou a meta. A sessão de Imersão passou de 35 para 55 minutos e de três estrelas (60) para quatro (80). O Analytics mostrou os 55 minutos retornados pela API. Um 503 simulado no histórico foi seguido de nova tentativa que recuperou a lista real. Cobertura vinculada a WEB-02 a WEB-05. | Aprovado |
| 42 · Segundo navegador e acessibilidade | Edge 158 em 1440 × 900 e Chrome 157 em 390 × 844 e 320 × 740 emulados. Os três catálogos e detalhes couberam nas larguras testadas. Foram verificados foco, ativação por teclado, nomes na árvore de acessibilidade e marcação `pt-BR` e `ja`. Falta validação com leitor de tela. | Parcial |

**Correção encontrada nesta rodada.** O formulário reenviava `unit: ""` de metas como Kanji e Gramática. A API retornava 400. O cliente compartilhado passou a omitir a propriedade vazia, permitindo que o backend mantenha a unidade padrão. O teste existente cobre, no mesmo envio, uma meta em minutos, uma com unidade vazia e outra com unidade ausente. O build corrigido foi validado nas duas telas.

O Chrome também confirmou o detalhe de Kanji com ID inexistente e retorno ao catálogo, a recuperação da consulta de Gramática na primeira página com o mesmo filtro após um 503 simulado, e a busca de páginas e ações por botão e atalho. Essas verificações cobrem partes dos casos 7, 22, 35, 36 e 37.

**Ocorrências do ambiente.** A automação em sequência atingiu o limite de requisições. As rodadas seguintes foram espaçadas com o limite de produção ativo. Uma primeira chamada de `GET /dashboard/summary` retornou 500 com erro Prisma `P1001` de conexão ao PostgreSQL descartável. A chamada retornou 200 na recarga e a falha não reapareceu nas checagens seguintes. O teste de virada de dia no fuso do produto, previsto em WEB-04, ficou fora desta rodada.

**Decisão de liberação.** Bloqueada pela divergência do Swagger e pela cobertura pendente. O link da auditoria de origem não forneceu a matriz original, então a reexecução dos 43 cenários e o fechamento individual das 19 falhas ficam pendentes. Nenhum deploy ou migração foi aplicado à instância principal nesta etapa.

**Fontes** — [Auditoria do frontend de 23/11/2026](https://chatgpt.com/library?file_id=libfile_564b566c66e881919695cafa51db4c4f&account_id=personal) e [plano geral de correção e validação do Fluency OS](https://chatgpt.com/library?file_id=libfile_d7390a3bd7b88191881f7ee1647f8db2&account_id=personal).
