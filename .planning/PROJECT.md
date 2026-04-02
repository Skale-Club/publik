# Publik

## What This Is

Uma ferramenta web para facilitar a publicacao de livros na Amazon KDP. O usuario gerencia capa, contracapa, indice e conteudo em um painel admin, e a ferramenta gera os arquivos prontos para upload na Amazon — incluindo PDF formatado e arquivos nos formatos especificos da KDP.

## Core Value

Gerar arquivos prontos para publicacao na Amazon KDP a partir do conteudo do livro cadastrado no painel admin, sem que o usuario precise entender os requisitos tecnicos de formatacao da plataforma.

## Requirements

### Validated

- [x] Usuario pode cadastrar um livro com capa (upload de imagem) e contracapa (imagem ou texto livre) — Validated in Phase 5: Cover Management

### Active

- [ ] Usuario pode cadastrar um livro com capa (upload de imagem), contracapa (texto livre), indice (gerado automaticamente a partir dos capitulos, editavel) e conteudo (editor embutido ou importacao de arquivos Word/PDF/imagens)
- [ ] Usuario pode importar conteudo de arquivos externos (Word, PDF, imagens)
- [ ] Usuario pode escrever/editar conteudo dentro da ferramenta
- [ ] Indice gerado automaticamente a partir dos capitulos do conteudo
- [ ] Indice editavel manualmente pelo usuario
- [ ] Ferramenta gera PDF formatado do livro (margens, paginacao, fonte) pronto para download
- [ ] Ferramenta gera arquivos nos formatos exigidos pela Amazon KDP (interior PDF + capa)
- [ ] Suporte a qualquer tipo de livro (texto corrido, imagens + texto, livros ilustrados)
- [ ] Painel admin intuitivo para gerenciar livros
- [ ] Guia passo-a-passo para publicar na Amazon KDP (usuario nunca publicou antes)
- [ ] Interface em ingles (english-first)

### Out of Scope

- Editor visual de capa — usuario faz upload de capa pronta
- Suporte a multiplos autores — comecar com um unico usuario, escalar depois
- Publicacao direta na Amazon — a ferramenta gera os arquivos, o usuario faz o upload
- Aplicacao desktop — web app apenas
- Mobile app — web-first

## Context

- Usuario nunca publicou na Amazon KDP antes, entao a ferramenta precisa guiar o processo
- Uso pessoal inicialmente, mas a arquitetura deve permitir escalar para SaaS no futuro
- Amazon KDP tem requisitos especificos de formatacao (margens, dimensoes, codigo de barras, etc) que precisam ser pesquisados
- A contracapa na KDP tem formato especifico (sinopse, codigo de barras, preco) que precisa ser investigado

## Constraints

- **Plataforma**: Web app — acessivel pelo navegador
- **Idioma**: Interface em ingles (english-first)
- **Output**: PDF + arquivos formato KDP
- **Capa**: Upload de imagem pronta (nao editor visual)
- **Indice**: Gerado automaticamente mas editavel
- **Autores**: Multiplos autores nao sao prioridade agora

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app | Acessibilidade, sem instalacao, escalavel para SaaS | — Pending |
| Upload de capa pronta | Reduz complexidade, foco no core value | — Pending |
| Indice automatico + editavel | Melhor UX que manual puro, sem perder controle | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 — Phase 5 (Cover Management) complete*
