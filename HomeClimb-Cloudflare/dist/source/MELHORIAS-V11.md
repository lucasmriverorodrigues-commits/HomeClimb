# HomeClimb v0.11

- Editor preserva rolagem da página, janela e foto ao marcar agarras, trocar função e tentar outra sugestão. A foto reserva espaço antes de carregar. A classificação não força mais rolagem automática; Localizar na parede permanece explícito.
- Gerador começa na faixa inferior de 25% da distribuição classificada e termina na última faixa superior de 10%. Prioriza saídas boas; tipo batente e tamanho da marcação ajudam no desempate, sem inferir tamanho físico.
- As duas mãos respeitam as faixas; mãos juntas exigem cadastro compatível. Faixas configuráveis em Saída, final e alcance. Travessias seguem a direção horizontal escolhida.
- Quando não encontra caminho até a faixa final com alcance e apoios compatíveis, informa a falha em vez de encerrar no meio.

Verificação: 11 testes do gerador e 5 do cache passaram. No navegador, geração completa e marcação com zoom 200% mantiveram a rolagem do diálogo em 644 px, aumentando a seleção de 8 para 9 agarras. Ainda é necessário conferir o comportamento no celular físico.

Publique a pasta dist inteira no Netlify. Após baixar a atualização, feche todas as janelas do HomeClimb e reabra. O acervo permanece local.
