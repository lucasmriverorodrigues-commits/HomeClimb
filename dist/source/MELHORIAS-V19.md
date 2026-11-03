# HomeClimb 0.19 — direção da puxada e continuidade corporal

## Como usar

1. No Muro, selecione uma agarra. Em **Para onde você puxa?**, toque na seta correspondente à força que sua mão exerce sobre a agarra na foto: ↓ para baixo, ↑ invertida, ←/→ lateral, ou uma diagonal. A seta aparece sobre a foto ampliada. O ajuste fino permite corrigir o ângulo sem abrir o teclado.
2. Escolha **Direcional** (perto da seta), **Ampla** (aceita diagonais) ou **Livre** (vários lados). **Não sei** deixa a direção desconhecida. **Próxima sem direção** percorre as agarras de mão da mesma face, sem selecionar as somente pé.
3. No gerador, escolha **Curtos e controlados**, **Equilibrados** ou **Amplos**. O nome do gerador e a regra de dois pés baixos foram mantidos.
4. Confira as medidas da face: largura e altura da área exata da foto, fotografada de frente. O motor ainda trabalha num plano; zoom, recorte, perspectiva e volumes podem distorcer a escala.

As alterações no cadastro valem para novos boulders. Boulders salvos conservam sua montagem. Não é necessário refazer os contornos. Valores numéricos antigos sem confirmação explícita de direção não viram automaticamente uma invertida ou uma puxada para baixo.

## O que mudou no motor

Antes, o ângulo só adicionava uma pequena penalidade fixa ao grau. Agora, a força indicada é comparada com a posição aproximada do ombro em cada postura candidata. Puxadas incompatíveis com o setor escolhido são descartadas. Uma invertida pode funcionar quando o corpo sobe, e uma lateral depende do lado em que o corpo está posicionado. A direção descreve o uso com as mãos; não impõe automaticamente essa mesma regra aos pés.

O motor conserva diferentes posições possíveis de quadril para os mesmos contatos, procura uma postura próxima da anterior e verifica os contatos que permanecem durante a troca de um membro. A busca prossegue da postura alcançada, em vez de voltar silenciosamente à postura estática mais barata. Saídas com dois pés têm preferência quando a geometria as permite.

O limite de amplitude é aplicado ao deslocamento da **mesma mão**, não somente à distância entre duas agarras vizinhas. Os limites de composição são 0,7 / 0,9 / 1,1 vezes a envergadura de cada perfil, respectivamente. São preferências de projeto ajustáveis, não limites fisiológicos medidos. A geometria dos braços e pernas continua sendo verificada separadamente.

A sugestão mostra quantas puxadas foram confirmadas e o maior deslocamento de mão da beta sugerida para o perfil intermediário. Editar manualmente as marcações ou a regra de pés remove o resumo antigo para não apresentá-lo como análise da nova montagem. On the Rock reutiliza a análise de direção e deixa de tratar uma direção desconhecida como se fosse invertida.

## Limites e referências

O modelo é uma heurística geométrica em 2D, sem equilíbrio completo de forças, profundidade, atrito ou simulação dinâmica. O alinhamento mão–ombro aproxima a puxada; não modela cada posição de punho/cotovelo, gaston, gancho de calcanhar ou oposição possível. A busca é limitada e pode deixar de encontrar uma beta existente. Os graus não foram calibrados nem validados por escaladores. É preciso testar as sugestões no muro e revisar as classificações.

As referências sustentam considerar orientação, postura e apoios; não fornecem nem validam os coeficientes usados no HomeClimb:

- Seifert et al. (2018), *Affordance Realization in Climbing: Learning and Transfer*: alterou a orientação das agarras mantendo suas posições e analisou aprendizagem e padrões de movimento. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.00820/full
- Bonelli et al. (2026, publicado online em 2025), *Climber’s muscle excitation and force distribution at different wall angles and body positions*: examinou 14 escaladores em duas posturas estáticas e três pequenas inclinações. Seus resultados não equivalem a uma validação de boulders dinâmicos ou tetos. https://link.springer.com/article/10.1007/s00421-025-06047-y

## Verificação e atualização

Os testes cobrem puxada lateral, invertida inadequada/acessível, direção desconhecida, amplitude, continuidade entre movimentos, exportação/importação e os recursos anteriores. Os relatórios anexos usam muros sintéticos, não o muro real do usuário. A conferência visual automatizada foi interrompida porque a ferramenta não conseguiu identificar a URL do navegador; a interação visual no celular ainda precisa ser conferida.

No celular: **Instalar → Verificar download**, aguardar a atualização, fechar todas as janelas/atalhos do HomeClimb e reabrir. A versão aparece no rodapé e no status do download. Não limpar os dados do navegador. A versão do Netlify permanece intacta.
