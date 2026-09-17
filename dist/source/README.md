# HomeClimb v0.18 — código correspondente

Aplicativo estático. Os módulos JS incluídos são o código-fonte, sem etapa de compilação. Sirva a pasta via HTTP local ou HTTPS (Cloudflare ou Netlify); file:// não suporta os workers. Modelo e runtime estão incluídos para funcionamento offline.

Código próprio: GNU AGPL-3.0, Copyright 2026 Lucas e colaboradores. Dependências mantêm as licenças indicadas em codigo.html.

Modelo original: https://huggingface.co/jwlarocque/yolov8n-freeclimbs-detect-2 . Baixe yolov8n-freeclimbs-detect-2-fp32.onnx desse repositório e renomeie para holds.onnx, coloque ao lado de resize-model.py, instale onnx==1.18.0 e numpy e execute python resize-model.py. A conversão altera dimensões e constantes de grade; não treina pesos. O arquivo gerado substitui models/holds-640.onnx. Dados de treinamento não disponibilizados pelo autor.

Runtime: onnxruntime-web@1.22.0 no npm, arquivos dist/ort.wasm.min.js, dist/ort-wasm-simd-threaded.mjs e dist/ort-wasm-simd-threaded.wasm; fonte https://github.com/microsoft/onnxruntime/tree/v1.22.0 .

A foto enviada para avaliação não faz parte deste pacote.






