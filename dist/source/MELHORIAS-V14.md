# HomeClimb v0.14

- Locais independentes com faces, agarras e biblioteca próprios. O acervo antigo continua no local original. Backup inclui todos os locais.
- Compartilhar na biblioteca exporta um boulder e as fotos/agarras das faces usadas. Receber boulder adiciona sem substituir o acervo. Se o local for desconhecido, cria um local com a referência recebida. Não há alinhamento automático entre fotos diferentes: ambos devem usar o cadastro compartilhado. A montagem original permanece no boulder mesmo se o muro for alterado depois.
- Concluir digitação e retirada de foco em ações de marcação; diálogos não abrem automaticamente o teclado. Validação do teclado físico do celular ainda necessária.
- On the Rock: segunda distância C–D para conferir a escala A–B. Rejeita diferença acima de 10% (limite prático, não certificação de precisão). Mantém comparação de distâncias, tipo e direção. Fotos frontais e medidas reais do muro continuam necessárias. Não corrige perspectiva nem profundidade; não equivale a reconstrução 3D.
- Ajuda atualizada e código correspondente AGPL na distribuição.

Validação: 38 testes automatizados de dados, geração, pés, escala, compartilhamento e PWA; cadastro/troca de local e formulário On the Rock verificados em navegador com dados de teste isolados. Não foi feito ensaio físico na rocha nem em celular real nesta entrega.

Publicação manual: enviar a pasta dist ao Netlify. Fechar e reabrir o aplicativo após baixar a atualização.
