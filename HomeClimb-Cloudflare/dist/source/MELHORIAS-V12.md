# HomeClimb v0.12

## Geração e espaço da face

O percurso precisa avançar pelo menos 60% da dimensão da face na direção escolhida e 80% da extensão ocupada pelas agarras classificadas. A separação entre qualquer mão de saída e qualquer mão de final também é verificada. A busca orienta os movimentos ao longo desse espaço e valoriza distribuição lateral quando compatível com grau e alcance.

Agarras classificadas apenas numa região pequena geram uma orientação para completar a classificação na base e no topo, em vez de um boulder artificialmente curto. As regras de faixa, apoios, alcance e mãos juntas continuam em vigor. Um percurso pode ser recusado quando o número de movimentos não permite cobrir a face.

## Face e janela

Corrigido o editor que sempre iniciava na primeira face cadastrada. Agora abre na face das saídas do boulder, inclusive ao retomar pela sessão. Um boulder novo manual usa a face atual. Tentar outra sugestão atualiza o editor aberto, preservando zoom, rolagem e função selecionada. Resultado de uma regeneração é descartado se o usuário já saiu daquele rascunho.

## Verificação

14 testes do gerador/seleção de face e 5 do cache passaram. No navegador, um muro com duas faces gerou na segunda face e manteve essa face e zoom de 200% ao pedir outra sugestão. O comportamento no celular físico ainda precisa ser conferido.

Publicar dist inteira no Netlify. Aguardar o download da atualização e fechar todas as janelas do HomeClimb antes de reabrir. O código correspondente desta versão acompanha o pacote.
