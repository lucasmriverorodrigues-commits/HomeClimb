# HomeClimb 0.20 — GitHub + Cloudflare

Esta pasta contém a versão 0.20, com comparação da mesma mão e sequência indicada no On the Rock, além de setas compartilhadas entre rocha e muro. Mantém as melhorias anteriores, com setas de puxada, verificação de direção conforme a postura e limites de deslocamento da mesma mão. Continua com dois pés nas linhas baixas para a saída e reaproveitamento das agarras de mão como pés durante a subida. Só acrescenta até dois apoios no meio se a busca com os pés da base não encontrar uma sequência viável. O detector, a câmera, os dados salvos e as demais ferramentas foram preservados. A versão do Netlify não foi modificada.

## Atualizar o projeto Workers já publicado

No GitHub Desktop, selecione HomeClimb, confira as alterações, faça Commit to main e Push origin. O Cloudflare publica automaticamente a branch main. O comando de build continua sendo `node verificar.mjs`; o deploy é `npx wrangler deploy --assets ./dist --name homeclimb --compatibility-date 2026-09-16`.

Abra o mesmo endereço workers.dev já usado. Feche todas as janelas e o atalho do HomeClimb e reabra após a nova versão ser baixada. A versão 0.20 aparece no aplicativo. Não limpe os dados. Uma atualização no mesmo endereço preserva o acervo; o backup abaixo é necessário ao trocar de endereço e útil como cópia de segurança.

As instruções de criação de um novo projeto Pages abaixo são opcionais; o projeto Workers existente já atende este aplicativo.

## 1. Guardar seus dados

No HomeClimb antigo, exporte o backup antes da mudança. As fotos, faces, agarras e boulders estão no armazenamento do navegador, não nesta pasta nem no GitHub. No novo endereço, importe esse backup. Confira os dados antes de remover o atalho antigo. Cada usuário faz a própria transferência.

## 2. Colocar esta pasta no GitHub

O caminho mais simples para enviar todos os arquivos, inclusive os grandes, é o GitHub Desktop:

1. Instale o GitHub Desktop e entre na sua conta: https://desktop.github.com/
2. Use File → Add local repository e escolha esta pasta HomeClimb-Cloudflare.
3. Se informar que não é um repositório, use a opção para criar um repositório neste local. Confira que a pasta selecionada contém este README e a subpasta dist; não crie outra pasta vazia dentro dela.
4. Faça o primeiro commit, caso ainda haja arquivos pendentes.
5. Clique em Publish repository. Nome sugerido: homeclimb. Pode deixá-lo público: o aplicativo e o modelo são distribuídos sob AGPL-3.0, com os avisos das dependências preservados. Não coloque backups pessoais ou fotos dos usuários no repositório.

Envie o conteúdo desta pasta inteira. Não envie apenas o ZIP e não use Git LFS para os arquivos do site. O código-fonte para download continua incluído em dist/homeclimb-source.zip.

## 3. Publicar no Cloudflare Pages

1. Entre/crie sua conta em https://dash.cloudflare.com/
2. Em Workers & Pages, escolha criar um projeto **Pages** conectado ao Git (Import an existing Git repository / Connect to Git). A nomenclatura do painel pode variar. Não escolha um projeto Workers com comando wrangler deploy.
3. Autorize acesso ao repositório homeclimb no GitHub e selecione-o.
4. Preencha:

| Campo | Valor |
| --- | --- |
| Production branch | main, ou a branch principal exibida pelo GitHub |
| Framework preset | None |
| Build command | node verificar.mjs |
| Build output directory | dist |
| Root directory | deixar vazio, raiz do repositório |
| Variável de ambiente NODE_VERSION | 22 |

5. Salve e publique. O endereço será parecido com https://homeclimb.pages.dev, conforme o nome disponível.

O comando de build verifica os arquivos já prontos; não recompila o aplicativo e não precisa instalar bibliotecas. Use o endereço de produção para seus dados; endereços de preview possuem armazenamento separado.

## 4. Conferir no celular

- Abra o endereço HTTPS e importe seu backup.
- Confira locais, faces, fotos, classificação e agarras somente de pé.
- Teste detectar agarras, montar/salvar e gerar/próximo boulder.
- Teste On the Rock e as medidas de referência.
- Permita o acesso à câmera e confira alinhamento/realidade aumentada numa face real.
- Em Instalar, verifique o download offline, instale o novo atalho e teste reabrir sem internet após concluir o download.
- Confira exportar/importar e compartilhamento de boulders.

O aplicativo conserva as limitações atuais: graus são estimativas, o alinhamento da câmera precisa de conferência e o compartilhamento não vira sincronização em nuvem com esta hospedagem. A publicação na sua conta e o teste físico no celular ainda precisam ser feitos.

## 5. Atualizações futuras

Atualize os arquivos desta pasta, faça commit no GitHub Desktop e use Push origin. O Cloudflare publica a branch principal automaticamente. Sempre confira o resultado do build antes de abrir a nova versão. Ao alterar arquivos do aplicativo, atualize a versão do cache em dist/sw.js e o pacote de código-fonte correspondente. Para ativar uma atualização offline, feche todas as janelas/atalhos do HomeClimb e abra novamente; não limpe os dados do navegador.

## Verificação local opcional

Com Node.js 22 ou superior, abra um terminal nesta pasta:

```powershell
node verificar.mjs
node testar.mjs
```

Para comparar os arquivos com a versão original entregue, use `node verificar.mjs --original`. Esse comando é somente para auditoria da entrega: mudanças futuras legítimas causarão diferenças.

## Conteúdo e licenças

- dist/: site completo, detector ONNX, OpenCV, workers, câmera, PWA, licenças e código-fonte.
- dist/_headers: configuração HTTP do Cloudflare, com revalidação de arquivos para as atualizações.
- tests/: testes automatizados existentes do aplicativo.
- arquivos-originais.json: hashes SHA-256 dos arquivos copiados.
- verificar.mjs / testar.mjs: verificação da distribuição e execução dos testes.

Não é necessário configurar chaves de API, banco de dados, domínio pago ou conta do Netlify. Os arquivos de publicação do Netlify e as páginas internas de diagnóstico foram excluídos do site desta cópia; os módulos do aplicativo são idênticos aos originais.

Documentação oficial:
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/platform/limits/
