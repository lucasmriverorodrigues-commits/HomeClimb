# HomeClimb 0.18 — dois pés na base

O gerador começa com dois apoios nas linhas mais baixas da face. Durante a subida, as agarras de mão selecionadas também podem servir de pé quando a postura permite. A classificação “somente pé” continua impedindo uso com as mãos.

A busca compara primeiro os percursos com os dois apoios da base. Somente se não encontrar um percurso viável para os três perfis de escalador, tenta um e depois dois apoios intermediários. Não acrescenta pés para aproximar artificialmente o grau do alvo. Se duas adições não resolverem, informa que não encontrou uma sequência, sem encher o muro de marcações P.

Os dois apoios ficam no quarto inferior da extensão vertical das agarras cadastradas, próximos da saída. A postura inicial com ambos é conferida para os três perfis. A busca testa duas combinações de base por percurso; as tentativas de recuperação são limitadas a duas combinações de percurso/base e quatro candidatos intermediários. Cada adição única é testada antes das duplas. Esses limites mantêm o tempo de resposta previsível; não representam prova de impossibilidade física.

O número de apoios e as faixas são preferências de composição solicitadas pelo usuário. Não são limites biomecânicos universais. O grau continua sendo uma estimativa heurística independente do alvo, sem calibração com graus de escaladores. Um teste físico continua necessário para confirmar conforto, beta e dificuldade.

O nome do gerador, a montagem manual, boulders salvos, detecção, câmera, compartilhamento e On the Rock foram preservados. A política de apoios desta versão é específica do gerador. O cache offline e o pacote de código correspondente foram atualizados. Gere um novo boulder para usar a nova regra; os já salvos não são reescritos.

Validação: 97 testes automatizados passaram. Nos nove cenários sintéticos de regressão (vertical, negativo, teto, muro denso e compacto), todos usaram dois pés na base e nenhum adicional no meio; todos encontraram betas para os três perfis e reaproveitaram agarras de mão como pés. Um teste separado demonstrou uma sequência que falha com os pés da base e se torna viável com um apoio intermediário. Os cenários são sintéticos, não reproduções medidas das fotos do usuário. Detalhes em `base-feet-regression-report.json`.
