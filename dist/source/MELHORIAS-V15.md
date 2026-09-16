# HomeClimb v0.15 — evolução do gerador existente

Os nomes dos botões, o cadastro, a leitura de agarras e o formato principal do acervo foram preservados. Não há outro aplicativo nem novo processo de classificação.

## O que mudou

O gerador constrói candidatos com as agarras já cadastradas e compara a dificuldade prevista por um avaliador independente. Este avaliador não lê o grau solicitado, o nome nem o grau salvo no boulder. O resultado continua aproximado: se a busca não alcançar o alvo, o aplicativo informa isso sem atribuir artificialmente o grau pedido.

Cada beta contém contatos de mão esquerda/direita e pé esquerdo/direito, quadril e centro de massa aproximados. As transições reposicionam os pés individualmente antes ou depois de um movimento de mão. Uma agarra liberada pela mão pode virar pé. O cadastro “Somente pé” continua excluindo a agarra das mãos; “Cabe juntar as duas mãos” continua tratando apenas de duas mãos simultâneas.

Os custos consideram qualidade e tipo da mão, mão de apoio, pés, alcance relativo ao corpo, inclinação, compressão, extensão, pé alto, equilíbrio e necessidade aproximada de movimento dinâmico. Um pé alto é avaliado junto da postura, sem limite de altura absoluto no muro. Um apoio não usado pelas betas avaliadas é removido da sugestão.

Três perfis configuráveis (1,55 / 1,72 / 1,90 m) fazem buscas próprias. Não há bônus de habilidade por altura. Por padrão são recusados candidatos sem beta encontrada para algum perfil ou com sensibilidade morfológica elevada. “Não encontrada” significa limite desta busca, não prova de impossibilidade humana.

A busca pode saltar agarras, trocar a mão que se move e usar match quando permitido. Compara a beta pretendida com alternativas; o grau segue a mais fácil encontrada, incluindo crux, principais movimentos, média, continuidade e recuperação aproximada. A busca é limitada e não garante encontrar a beta mais fácil que uma pessoa descobriria.

## On the Rock

O encaixe geométrico continua usando a escala A–B e a conferência C–D, qualidade, tipo e direção. Agora os melhores encaixes também passam pela análise corporal do muro de destino, com propostas de pés. Encaixes sem beta encontrada para todos os perfis recebem aviso explícito nas notas; não são anunciados como reprodução validada. O cálculo roda em um worker para não bloquear a interface.

Não há grau inferido para a rocha a partir de uma foto. A análise se refere ao muro cadastrado. A foto não mede profundidade, superfície útil, atrito ou equivalência mecânica entre rocha e resina.

## Arquitetura e limites

- `generation-config.js`: parâmetros de engenharia versionados; não são constantes científicas nem pesos aprendidos.
- `movement-model.js`: coordenadas em metros no plano da face, features de mão/pé e postura aproximada.
- `beta-search.js`: busca limitada de estados e transições; mãos e pés obedecem às regras do boulder.
- `boulder-grader.js`: grau independente do alvo, betas, crux, sensibilidade e diagnóstico de atalhos.
- `support-proposal.js`: candidatos a apoio e remoção dos não usados.
- `generator.js`: candidatos, avaliação, nova tentativa quando distante do alvo e seleção final.

O modelo não resolve forças, torque, contato 3D, equilíbrio real em suspensão, flexibilidade individual, heel/toe hooks, impulsos ou riscos de queda. No teto, aproxima o eixo corporal pela distribuição dos contatos. Contato simultâneo mão + pé só é considerado se explicitamente indicado internamente por `handFootCompatible`; não é inferido de `match` nem do tamanho do círculo desenhado. Não foi adicionado campo obrigatório ao cadastro.

Direção antiga igual a zero é desconhecida, pois era o valor padrão. Direções não zero previamente registradas e futuras edições explícitas são aproveitadas. Falta de informação reduz o índice interno de confiança. Esse índice mede completude e consistência heurística; não é probabilidade de acertar um grau.

O campo opcional `generationAnalysis` registra a versão e resumo de diagnóstico, sem migrar nem regraduar boulders existentes. `debugGeneration:true` devolve diagnósticos de candidatos e a beta usada; não aparece na interface. Tentativas e encadenamentos existentes são preservados. Aprendizado com feedback e modelos treinados permanecem futuros: não há dados rotulados suficientes nesta entrega.

## Pesquisa consultada

- [Duh e Chang / MoonBoardRNN](https://github.com/jrchang612/MoonBoardRNN) e [artigo BetaMove](https://arxiv.org/abs/2102.01788): referência para separar inferência de sequência, geração e graduação. Não foram importados pesos nem o conjunto de problemas coletado por terceiros.
- [O’Mara e Mahmud, revisão de graduação](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1512010/full): enquadra métodos baseados em movimentos e posturas; não oferece conversão universal de distância para grau.
- [Bonelli et al., posição corporal e inclinação](https://pmc.ncbi.nlm.nih.gov/articles/PMC13236747/): fundamento qualitativo para considerar ambos. O experimento não calibra nossos coeficientes nem valida extrapolação a tetos.
- [MoonBoard: regras e benchmarks](https://moonclimbing.com/using-your-moonboard): regras de pés e problemas revisados por moderadores servem de referência conceitual. Sem importação de dados de terceiros nesta versão.
- [CWA: Routesetting Guide](https://www.cwapro.org/blog/shape-the-future-of-routesetting-cwas-routesetting-guide): avaliação de movimentos e rotas como parte do processo de montagem.
- [Lattice: proporções corporais](https://www.latticetraining.com/blog/does-ape-index-matter-in-climbing-lattice-training): não transformar dimensões corporais em habilidade.

As referências orientam a arquitetura. A validade científica dos pesos e da previsão de grau do HomeClimb não foi demonstrada.

## Validação reproduzível

`tests/movement.test.mjs` cobre mudança mão→pé, match, qualidade dos pés, high-step coerente e incoerente, morfologia, atalho, inclinação, independência do grau e compatibilidade.

`tests/engine-regression.mjs` preserva muros e boulders da v0.14, compara os dois geradores e grava `engine-regression-report.json`. `tests/golden_dataset` separa casos sintéticos de desenvolvimento e validação. Esses casos verificam funcionamento; não são benchmarks graduados por escaladores. `expectedGradeRange`, acurácia exata e acurácia até um grau ficam nulos deliberadamente.

Para calibrar de verdade: coletar boulders consentidos com foto frontal, medidas, inclinação, classificação, betas observadas e avaliações independentes de escaladores; separar muros de treino e validação; medir antes de definir metas. Não usar previsões do próprio motor como rótulos de verdade.

## Publicação

Resultado desta entrega: 54 testes automatizados passaram nas suítes de dados, gerador, classificação/On the Rock, escala, locais/compartilhamento, movimentos e PWA. Na regressão sintética, ambos os geradores produziram 6/6 rotas estruturalmente válidas; o avaliador encontrou 2 atalhos relevantes nas rotas antigas e 1 nas novas. Não houve alerta morfológico nas seis rotas finais. Isso não mede acurácia de graus reais. O relatório JSON acompanha esta entrega.

A primeira geração foi verificada no navegador, na face escolhida. A conferência visual final de “Próximo boulder” foi interrompida pela revisão automática da ferramenta por limite de uso. Os testes locais continuaram; não foi feito teste em celular físico nem validação por escaladores.

Subir a pasta `dist` no Netlify. Fechar todas as janelas após o download da atualização. Dados do usuário continuam no aparelho e não devem ser apagados para atualizar.
