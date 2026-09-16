# HomeClimb v0.9 — reconhecimento automático

A leitura padrão agora usa um detector neural treinado para agarras de muros caseiros, seguido de refinamento local com GrabCut. A imagem inteira e partes sobrepostas são analisadas para recuperar agarras pequenas. Duplicatas são filtradas. Nenhuma foto sai do aparelho.

## Resultado com a foto enviada

O detector antigo selecionou 25 regiões. No navegador de teste, a versão nova propôs 209 regiões: 156 selecionadas automaticamente e 53 para conferir. São sugestões, não uma contagem validada de acertos. Algumas bordas ainda pegam sombra, magnésio ou apenas parte da agarra. Caixas tracejadas indicam propostas sem borda refinada. Não há promessa de contorno exato em qualquer foto.

## Uso

1. Abra a face e toque em Encontrar agarras. A análise começa sozinha.
2. Acompanhe a leitura por partes. Use Parar leitura se necessário.
3. Confira as selecionadas, use zoom e Mostrar incertas. Toque para incluir ou excluir.
4. Adicione as agarras. Classificação e edição manual continuam disponíveis.
5. Em aparelhos que não executem o detector, use Alternativa por cores ou a marcação manual.

## Publicação e atualização

Suba a pasta dist inteira no Netlify, incluindo models e vendor. Não publique evaluation ou a foto de teste. O primeiro carregamento é maior por incluir modelo e runtimes; aguarde a indicação de pronto para uso sem internet. Feche todas as janelas e o aplicativo instalado para ativar uma atualização baixada. Não limpe os dados do navegador: o acervo é local.

O rodapé contém Código aberto e licenças e um download do código correspondente, sob AGPL-3.0 conforme autorização do proprietário. Dependências mantêm suas licenças.

## Verificação

Teste no navegador com a foto real, confirmação das 156 sugestões; cinco testes do adaptador neural e 54 testes de regressão (cadastro, biblioteca, gerador, contornos, câmera, rastreamento e cache). O desempenho em um celular físico e a RA no muro real ainda precisam de validação. Câmera continua experimental.
