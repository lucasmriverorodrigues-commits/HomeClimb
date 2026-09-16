# HomeClimb v0.13

## Sugestões diretas

Depois da configuração inicial, o gerador mostra a foto do boulder com Anterior, Próximo boulder, Editar/visualizar e Salvar. As oito últimas sugestões ficam disponíveis durante a sessão. Voltar a uma sugestão já vista não recalcula. A visualização não altera marcações ao tocar na foto. A edição completa continua acessível. Navegação por tela/face é lembrada via sessionStorage quando disponível; rascunhos não salvos não sobrevivem a recarregamento.

## Somente pé

No cadastro, Uso da agarra permite Mãos e pés ou Somente pé. Pés exclusivos recebem indicação P e cor azul, em qualquer altura. Não entram nas mãos do gerador ou da adaptação da rocha. No editor, uma tentativa de usá-los como mão informa o motivo. Qualidade continua independente; um pé sem qualidade informada pode ser apoio, com custo conservador no gerador. Backups antigos continuam válidos; novos preservam footOnly. Montagens já salvas mantêm seu cadastro original.

## On the Rock: escala e pegadas

A opção padrão solicita duas marcas na foto e a distância medida entre elas. A distância na imagem é calculada com a proporção largura/altura; a referência converte as coordenadas em metros. O ajuste de 100% preserva a escala estimada. Se o conjunto não cabe na face, o app pede uma face maior ou uma redução explícita. Sem medida, permanece apenas a comparação de proporções, identificada como sem escala real.

Tipo, qualidade e direção de puxada podem ser editados por pegada. Uma linha indica a direção na foto. A busca considera esses atributos e compara os deslocamentos entre pegadas com os das agarras existentes. Nas notas aparecem distâncias da referência adaptada e do muro; o grau não é inferido. A foto da rocha é temporária e não fica no backup.

Fotografe de frente e inclua uma referência no mesmo plano das pegadas. Zoom e distância de câmera podem variar se a referência estiver na própria foto; a medida compensa escala uniforme, não perspectiva, distorção de lente ou profundidade. Use uma foto por plano. No muro de casa, largura e altura devem corresponder à área fotografada. Orientação de puxada é na foto, não uma medição 3D.

Base técnica: [OpenCV — homografia e hipótese de plano](https://docs.opencv.org/4.11.0/d9/dab/tutorial_homography.html). Nesta versão usamos escala de dois pontos, sem correção por homografia. Fotos oblíquas precisam ser refeitas de frente.

## Verificação

Testes de escala com zoom/recorte, recusa de ajuste automático quando não cabe, uso exclusivo de pé, backup e adaptação; regressão de gerador, cadastro e cache. No navegador: geração, próximo/anterior, visualização sem edição acidental, salvamento de Somente pé e abertura dos controles de escala e orientação. Ainda requer comparação de lances reais e teste em celular físico.

Publique dist inteira no Netlify e aguarde a atualização baixar. Feche todas as janelas e reabra para ativá-la. Não limpe o armazenamento do aplicativo.
