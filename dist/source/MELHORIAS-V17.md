# HomeClimb 0.17 — mãos que também viram pés

As imagens enviadas mostraram que reduzir uma quantidade média de pés ainda não era suficiente: um P no meio ou no alto pode ser dispensável quando as mãos do próprio boulder oferecem apoio. A v0.16 encerrava a retirada ao atingir uma quantidade preferida; a v0.17 elimina essa cota.

## Comportamento

- O gerador testa primeiro o conjunto de mãos, com a regra pés seguem mãos. Não exige cadastrar um apoio externo para começar a busca.
- Se esse conjunto não atender aos três perfis, procura apoios adicionais. Na simplificação testa também manter somente os apoios da saída e reaproveitar as mãos no restante.
- A remoção continua abaixo de três, dois ou um P, até zero quando houver uma beta aceitável. Não há quantidade mínima obrigatória de P.
- Cada remoção reavalia alcance, postura, qualidade dos contatos e morfologias. Pode conservar um pé que a busca limitada não consiga substituir. Não se declara prova matemática de que todos os apoios restantes são indispensáveis.
- Os apoios da saída não são descartados apenas para enxugar a foto. Em faces abaixo do limiar de teto, a saída padrão exige pelo menos um pé abaixo ou aproximadamente na linha das mãos iniciais, com tolerância de 4 cm entre centros; isso evita obter artificialmente zero P colocando ambos os pés acima das mãos na saída. A tolerância preserva saídas baixas com mãos e pés na mesma fileira. A regra não proíbe high-step durante a progressão. Tetos mantêm a orientação do corpo baseada nos contatos.
- A prioridade geométrica dos pés em faces verticais/inclinadas considera a região abaixo das mãos. A mesma distância radial acima e abaixo deixou de receber a mesma prioridade. A posição efetiva continua sendo validada pelo modelo corporal.
- A busca pode manter os pés no lugar durante o próximo movimento de mão, evitando reposicionamento desnecessário.
- As transições incluem pé → mão → pé. Por exemplo, um pé sai de C, a mão passa de B para C e o outro pé ocupa B. Cada etapa movimenta um único membro e verifica a postura, respeitando a indisponibilidade de uma agarra ainda ocupada.
- A simplificação pode aceitar um grau estimado menor em vez de conservar apoios redundantes para tentar aproximar artificialmente a previsão do alvo. O grau continua vindo do grader independente.
- O resumo sob a foto informa “Mãos também valem como pés” quando a regra é seguir mãos. Os contornos P continuam representando apoios adicionais, não a totalidade de onde se pode pisar.

## Verificação

Testes específicos cobrem retirada abaixo da antiga cota, remoção do último P, aproveitamento das mãos, saída com apoio inferior e a transição mista pé/mão/pé. Os testes existentes mantêm high-step válido, três morfologias, mãos juntas, regras de pés, PWA, câmera, detector, salvamento e compartilhamento.

O relatório reuse-regression-report.json compara os mesmos nove casos sintéticos da v0.16. A média de pés adicionais caiu de 3,56 para 0,33 (intervalo final de 0 a 2); todos tiveram beta encontrada nos três perfis e uso de agarras de mão como pés. A análise de atalhos permanece ativa. Os casos são sintéticos e não correspondem às medidas dos muros das capturas de tela; não constituem validação física ou validação de graduação.

## Atualização

O cache offline é v0.17 e inclui contact-transition.js. Gerar novos boulders após atualizar; os boulders já salvos não são alterados automaticamente. A entrega fica na pasta local do GitHub e na cópia Cloudflare, pronta para commit e push. A publicação ainda depende desses passos; a pasta do Netlify não é modificada.

O gerador continua sendo uma aproximação geométrica, sem força medida, textura, atrito ou reconstrução 3D. Para testar exatamente RJ1 e Ratoeira são necessários o backup com coordenadas/classificações e as medidas cadastradas, que não podem ser recuperadas com precisão somente destas capturas de tela.
