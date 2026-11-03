# HomeClimb 0.20 — On the Rock: comparar movimentos

Esta versão inclui as setas de puxada e o controle de amplitude da versão 0.19. O On the Rock passa a usar as mesmas setas no cadastro da rocha e do muro, além de comparar o deslocamento da mesma mão e procurar uma sequência com essas mãos na ordem indicada.

## Como usar

1. No cadastro do muro, confira as medidas da área fotografada e indique qualidade, tipo, puxada e se cabe juntar mãos. Agarras sem direção continuam disponíveis, mas essa parte da comparação fica desconhecida.
2. Abra **On the Rock**. Fotografe um único plano da rocha de frente. Meça uma referência A–B e um segundo trecho C–D no mesmo plano, preferencialmente em outra região/direção. O aplicativo confere se as duas escalas diferem em até 10%. Essa conferência não corrige perspectiva ou profundidade.
3. Marque saída esquerda, saída direita, os movimentos, final esquerdo e final direito. Nos movimentos intermediários, escolha a mão esquerda ou direita; a sugestão inicial alterna mãos, mas pode ser corrigida. Marque qualidade, tipo e a seta da força da mão sobre a pegada.
4. Para juntar mãos ou voltar a uma pegada, selecione o ponto e use **Repetir pegada**. O destino precisa permitir juntar mãos quando ambas ocuparem a mesma agarra. Excluir um ponto conserva as referências das repetições restantes.
5. Toque em **Comparar com meu muro**. Revise a tabela Rocha / Alvo / Muro: a coluna Alvo considera o percentual de reprodução escolhido. Cada lance compara o deslocamento da mesma mão, e não a distância até o ponto anterior da outra mão.
6. Abra **Tipo e puxada de cada pegada** para conferir diferenças ou informações ausentes. Salve o boulder; a comparação permanece disponível ao editar o projeto. Alterar marcações ou a regra de pés sinaliza que a comparação anterior ficou desatualizada.

## O que mudou

- A busca pode deslocar o desenho pelo muro, mantendo seus vetores como referência, sem o prender ao centro da foto. Não estica, gira, espelha nem reduz automaticamente a escala medida para fazer o desenho caber.
- A escolha combina posição, deslocamento da mesma mão, qualidade, tipo e direção de puxada. A busca corporal testa a sequência indicada, com a mão indicada. Uma beta alternativa que pula um movimento não serve como validação dessa sequência.
- Dois apoios nas linhas baixas têm preferência. As agarras de mão também servem como pés. Só se consideram até dois apoios no meio quando as opções avaliadas com pés na base falham. Agarras cadastradas como Somente pé podem servir de apoio, nunca de mão.
- Quando não se encontra uma sequência para os três perfis, o resultado é apresentado como encaixe geométrico para revisão. O aplicativo não troca silenciosamente por outra sequência e a chama de reprodução.
- A revisão mostra distâncias, diferença do vetor (distância e direção), tipos e puxadas. “Próximo” significa erro de até 12 cm ou 25% do lance, o maior deles. É uma tolerância de comparação escolhida no software, não um limiar fisiológico ou uma medida validada da qualidade do boulder.
- Sem medidas, o resultado é explicitamente uma comparação de proporções. Zoom, recorte e proporção da imagem são compensados somente quando se marca a referência na foto efetivamente usada, nas condições planas e frontais descritas.

## Validação e limites

Testes automatizados cobrem tradução do percurso, vetores da mesma mão, movimentos repetidos da esquerda, puxadas opostas, mãos juntas, exclusão de pegadas repetidas, zoom/recorte com outra proporção da imagem, ordem obrigatória das mãos e rejeição de um lance impossível que uma busca livre poderia pular. Os demais testes verificam gerador, pés, salvamento, compartilhamento, detector, câmera e cache offline por simulações locais.

O modelo continua geométrico em 2D. Foto não mede profundidade, aderência, posição real do punho, equilíbrio completo de forças ou diferenças de inclinação entre rocha e muro. A busca é limitada. Proximidade geométrica não garante o mesmo grau, a mesma sensação ou execução possível. Não houve validação física no muro nem conferência visual no celular: a ferramenta de controle visual interrompeu o acesso por não identificar a URL com segurança.

No celular, após a publicação: **Instalar → Verificar download**, aguarde, feche todas as janelas/atalhos do HomeClimb e abra novamente. Confira **v0.20** no rodapé/status. Gere uma nova comparação para usar estas mudanças; boulders antigos mantêm sua montagem. A versão Netlify foi preservada.
