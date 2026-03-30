# Publik - Amazon KDP Book Publisher

## O que e

Uma ferramenta web para facilitar a publicacao de livros na Amazon KDP. O usuario cadastra capa, contracapa, indice e conteudo no painel admin, e a ferramenta gera os arquivos prontos para publicar.

## Funcionalidades principais

- Painel admin para gerenciar livros
- Upload de capa (imagem pronta)
- Contracapa com texto livre e formato KDP (sinopse, codigo de barras)
- Indice automatico a partir dos capitulos (editavel pelo usuario)
- Editor de conteudo embutido + suporte a importar arquivos (Word, PDF, imagens)
- Suporte a qualquer tipo de livro (texto, imagens + texto)
- Geracao de PDF formatado (margens, paginacao, fonte) pronto para upload
- Geracao dos arquivos nos formatos que a Amazon KDP exige (interior PDF + capa)
- Versao PDF como output alternativo

## Usuarios

Uso pessoal inicialmente, mas arquitetura que permita escalar para SaaS no futuro.

## Restricoes

- Web app
- Amazon KDP como plataforma alvo
- Usuario nunca publicou na KDP antes - a ferramenta deve guiar o processo
- Upload de capa (nao editor visual)
- Indice: gerado automaticamente mas editavel
- Nao importa suportar multiplos autores agora - comecar simples

## Tech

- Web app (sem preferencia especifica de stack)
- Output: PDF + arquivos formato KDP
