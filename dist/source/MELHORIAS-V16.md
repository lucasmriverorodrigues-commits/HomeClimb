# HomeClimb 0.16 — composição do gerador

O gerador anterior podia propor 14 pés e preservar a união dos apoios usados nas betas principais, nas alternativas e na sequência pretendida. Isso deixava mais opções na foto do que um único boulder precisava. A vizinhança geométrica também admitia pares de mãos a partir de 7 cm, sem avaliar o amontoamento do conjunto.

## Alterações

- A seleção de mãos agora considera a separação de todos os pares, e não apenas a distância ao próximo ponto. Pares redundantes são rejeitados e conjuntos menos amontoados recebem preferência. Pares intencionais de saída/final em duas agarras continuam permitidos; match mantém o significado de duas mãos na mesma agarra.
- Distâncias são calculadas pelas medidas da face, em metros, e normalizadas pelas envergaduras de referência. Os parâmetros em `composition` são preferências de composição ajustáveis, não uma tabela científica de distância por grau. O alcance máximo e a análise corporal continuam independentes.
- Os apoios das betas principais dos três perfis são considerados primeiro. Depois o gerador tenta retirar apoios pouco utilizados. Cada retirada é reavaliada pelo grader; não é apenas uma limpeza visual da foto.
- O objetivo inicial é cerca de um apoio adicional a cada duas agarras de mão (3 para 6 mãos). É uma preferência, não um limite rígido: apoios adicionais podem permanecer se a busca não encontrar uma solução adequada sem eles.
- Remoções devem preservar uma beta para SHORT, AVERAGE e TALL, a dispersão de grau admitida e o número de pés na saída da beta anterior. A simplificação não força uma saída de dois pés a virar saída de um pé. Há tolerância limitada para mudança da estimativa, centralizada em configuração.
- As mãos selecionadas continuam disponíveis como pés. Os contornos de agarras classificadas apenas como pé continuam impedidos de receber papéis de mão.
- A estimativa, a análise de atalhos e a sequência sugerida são calculadas novamente no conjunto final. O grau pedido não é entrada do grader. A busca continua limitada e pode deixar alternativas não encontradas.
- As duas melhores composições passam por essa simplificação antes da escolha final. Há limites de tentativas para controlar o custo da busca.
- A geometria das posturas é reutilizada durante a avaliação da mesma parede imutável. As betas e os contatos permitidos são sempre recalculados após cada remoção. O cache é local, limitado e descartado após a operação.

## Preservação e distribuição

Não há migração do armazenamento, alteração da interface de cadastro, renomeação do gerador ou modificação dos boulders salvos. O detector e a câmera permanecem iguais. On the Rock mantém sua seleção de agarras e aproveita somente a otimização interna do grader compartilhado.

O cache offline passa para v0.16 e inclui route-refinement.js. Código correspondente e licenças acompanham a publicação. A entrega se destina ao repositório GitHub/Cloudflare existente; a pasta publicada pelo Netlify não é atualizada por esta tarefa.

## Verificação

Há testes para pares de mãos próximos, saída/final próximos permitidos, retirada de pés redundantes com três morfologias, manutenção de dois pés na saída, reavaliação do resultado final e ausência de mutação dos dados originais. Continuam os testes de mão que vira pé, high-step, qualidade dos pés, graduação independente, alcance, teto, salvamento, compartilhamento e PWA.

O arquivo density-regression-report.json compara nove casos sintéticos contra a versão 0.15, usando as mesmas faces, classificações, configurações e sementes. Inclui vertical, inclinação, teto, maior densidade e um muro compacto. Casos identificados como validation ficaram separados dos development. Não há notas de setters reais: isso mede regressão funcional, quantidade de apoios e separação geométrica; não mede precisão de graduação nem comprova conforto físico.

## Referências usadas e limites

- Revisão enviada pelo usuário: https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1512010/full — reforça a relevância da sequência e as limitações de generalizar resultados de paredes padronizadas. Não fornece parâmetros universais de distância por grau nem valida o modelo do HomeClimb.
- Texto público da CWA: https://www.cwapro.org/blog/shape-the-future-of-routesetting-cwas-routesetting-guide — destaca avaliação das rotas, compreensão do movimento e forerunning. O guia integral vinculado não pôde ser obtido nesta sessão; não foram atribuídas regras numéricas a ele.
- As duas instruções anteriores do usuário foram relidas e orientam a manutenção das três morfologias, reaproveitamento das mãos como pés, independência do grader e preservação do aplicativo.

O próximo passo de calibração física é comparar boulders reais do usuário com a percepção de escaladores. A precisão depende das medidas da face, da foto frontal e da classificação das agarras. Esta entrega não equivale a uma simulação biomecânica 3D validada.
