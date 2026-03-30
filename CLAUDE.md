<!-- GSD:project-start source:PROJECT.md -->
## Project

**Publik**

Uma ferramenta web para facilitar a publicacao de livros na Amazon KDP. O usuario gerencia capa, contracapa, indice e conteudo em um painel admin, e a ferramenta gera os arquivos prontos para upload na Amazon — incluindo PDF formatado e arquivos nos formatos especificos da KDP.

**Core Value:** Gerar arquivos prontos para publicacao na Amazon KDP a partir do conteudo do livro cadastrado no painel admin, sem que o usuario precise entender os requisitos tecnicos de formatacao da plataforma.

### Constraints

- **Plataforma**: Web app — acessivel pelo navegador
- **Idioma**: Interface em ingles (english-first)
- **Output**: PDF + arquivos formato KDP
- **Capa**: Upload de imagem pronta (nao editor visual)
- **Indice**: Gerado automaticamente mas editavel
- **Autores**: Multiplos autores nao sao prioridade agora
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5 | Full-stack web framework | Battle-tested major version with App Router, Server Actions, Turbopack builds (beta). 16.x is only 5 months old with breaking changes (async params, caching semantics). For a production tool, 15.5 is the safer bet — more community resources, fewer edge cases. |
| React | 19.x | UI library | Ships with Next.js 15.5. React 19 stable support since Next.js 15.1. Server Components for content-heavy pages (book editor), client components for interactive editor. |
| TypeScript | 5.x | Type safety | Industry standard. Next.js has first-class TypeScript support with zero config. Essential for a complex domain with book formatting rules and KDP spec constraints. |
| Tailwind CSS | 4.x | Styling | Default choice for Next.js apps. v4 is stable and established. Utility-first approach is ideal for building a custom admin panel UI without fighting a component library's design system. |
| Drizzle ORM | 0.45.x | Database ORM | TypeScript-first, lightweight, no binary engine. SQL-like syntax is easier to debug than Prisma's abstraction. Supports SQLite for development (personal use) and PostgreSQL for SaaS scaling. Prisma is the alternative but heavier and has slower cold starts. |
| SQLite | (via better-sqlite3) | Database (dev/personal) | Zero-config, file-based, perfect for single-user personal use. Drizzle supports it natively. Migrate to PostgreSQL when scaling to SaaS — Drizzle makes this seamless. |
| PostgreSQL | 17.x | Database (production SaaS) | Standard for multi-tenant SaaS. Drizzle supports it with full feature set including RLS. Use Neon, Supabase, or self-hosted. |
### Rich Text Editor
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TipTap | 3.x | Book content editor | **THE critical choice for this project.** Headless editor built on ProseMirror — battle-tested foundation. Framework-agnostic with first-class React support. Modular: add only what's needed (headings, images, tables). Has built-in **Table of Contents** extension (auto-generated TOC from headings — a core requirement). Outputs HTML/JSON that feeds directly into PDF generation. Custom styling means the editor UI matches the app perfectly. |
| @tiptap/extension-table-of-contents | 3.x | Auto TOC generation | Generates a clickable table of contents from heading nodes. Core requirement for Publik. Editable since it's built on ProseMirror nodes. |
| @tiptap/starter-kit | 3.x | Core editor extensions | Battery-included: bold, italic, headings, lists, code blocks, history (undo/redo), blockquotes, horizontal rules. |
- **vs Lexical (Meta):** Lexical is newer, less mature ecosystem. TipTap's extension model is more flexible for book-specific nodes (chapters, page breaks).
- **vs Slate:** Slate has had stability issues and API churn. TipTap's ProseMirror foundation is more battle-tested.
- **vs Editor.js:** Editor.js uses block-based JSON output that's harder to convert to PDF. TipTap's HTML output integrates naturally with @react-pdf/renderer.
### PDF Generation
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @react-pdf/renderer | 4.x | Book interior PDF generation | **Primary PDF engine.** React-based: define book pages as React components → render to PDF. Has critical features: page wrapping (auto page breaks), headers/footers, page numbers (`render={({ pageNumber }) => ...}`), bookmarks (PDF TOC), orphan/widow protection, hyphenation, font embedding. Works on both browser (BlobProvider, PDFDownloadLink) and server (renderToFile, renderToStream). This is the standard for generating structured, paged PDFs in React. |
| pdf-lib | 1.17.1 | PDF post-processing | **Secondary tool.** Merges cover image PDF with interior PDF. Sets PDF metadata (title, author, ISBN). Adds/ modifies pages. Works in all JS environments. Note: last published ~4 years ago, but the library is feature-complete and stable for these operations. |
| @pdf-lib/fontkit | 1.x | Custom font embedding | Required by pdf-lib for embedding custom fonts. KDP requires specific fonts — this enables embedding Garamond, Times New Roman, or any KDP-approved font into the PDF. |
- **vs Puppeteer (HTML→PDF):** Puppeteer spawns a full Chrome instance — heavy (200MB+), slow, resource-intensive. @react-pdf/renderer is a pure JS solution, faster, no Chrome dependency. Puppeteer would be a fallback if exact CSS rendering is needed for edge cases.
- **vs jsPDF:** jsPDF is low-level (manual x/y positioning). @react-pdf/renderer uses React's declarative model with flexbox-like layout — much easier to build complex book pages.
- **vs WeasyPrint (Python):** Would require a Python service. Keeping everything in TypeScript/Node reduces infrastructure complexity.
### Document Import
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| mammoth | 1.12.0 | Word (.docx) → HTML | Converts .docx files (Microsoft Word, Google Docs, LibreOffice) to clean HTML using semantic styles. 2.7M weekly downloads, actively maintained (published 18 days ago). Supports headings, lists, tables, images, footnotes, links. Custom style maps for mapping Word styles to HTML elements. Output HTML feeds directly into TipTap editor via `editor.commands.setContent()`. |
| pdfjs-dist | 4.x | PDF preview/reading | Mozilla's PDF renderer. Used for previewing uploaded PDFs in the browser. Note: PDF text extraction is unreliable for structured content — recommend users import Word docs instead. |
### Authentication
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Better Auth | latest | Auth framework | Auth.js (formerly NextAuth.js) has officially joined Better Auth (Sep 2025). Better Auth is now the recommended choice for new projects. Framework-agnostic, comprehensive features out of the box: email/password, social sign-on, 2FA, session management, rate limiting, automatic database migrations. Built-in plugin ecosystem. Better DX than Auth.js for complex auth flows. |
- Auth.js team explicitly recommends new projects use Better Auth
- Better Auth has a more comprehensive feature set (2FA, multi-tenancy, organization management built-in)
- Better Auth manages its own database schema and migrations
- Active development with enterprise backing
### File Upload
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| uploadthing | latest | File upload service | Typesafe file uploads designed for Next.js. Server-side auth middleware integrates with Better Auth. Free tier: 2GB storage, unlimited uploads. Handles cover images, Word doc imports, PDF exports. Dashboard for file management. Created by the T3 Stack team (Theo). |
| Local filesystem | (Node fs) | File storage (dev) | For development, store files locally using Node's fs module. Abstract behind a storage interface so switching to uploadthing/cloud storage is trivial when deploying. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.x | Runtime validation | Validate book metadata, KDP formatting parameters, user inputs. Integrates with Drizzle ORM (drizzle-zod) for form validation. Industry standard. |
| lucide-react | latest | Icon library | Consistent, lightweight SVG icons for the admin panel. Tree-shakeable. |
| sonner | latest | Toast notifications | Elegant toast notifications for save confirmations, upload progress, errors. Recommended by shadcn/ui. |
| nuqs | latest | URL state management | Sync editor state (current chapter, zoom level) to URL params. Enables shareable links and browser back/forward. Built for Next.js App Router. |
| clsx + tailwind-merge | latest | Class name utilities | Standard pattern for conditionally combining Tailwind classes without conflicts. `cn()` utility from shadcn/ui. |
| date-fns | latest | Date formatting | Lightweight date utility for displaying creation dates, last modified timestamps. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | Faster installs, strict dependency resolution. Standard for modern Next.js projects. |
| ESLint + Prettier | Code quality | Next.js 15.5 deprecated `next lint` — use ESLint directly with flat config. Prettier for formatting. |
| Drizzle Kit | Database migrations | `drizzle-kit generate`, `drizzle-kit migrate`, `drizzle-kit push` (for dev), `drizzle-kit studio` (visual DB browser). |
| TypeScript strict mode | Type safety | Enable `strict: true` in tsconfig. Essential for catching formatting bugs before runtime. |
## Installation
# Core framework
# Rich text editor
# PDF generation
# Document import
# Database
# Authentication
# File upload
# Validation & utilities
# Dev dependencies
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 15.5 | Next.js 16.x | If you want Turbopack stable builds, Cache Components, React 19.2 features (View Transitions). Accept the breaking changes (async params, caching defaults). |
| @react-pdf/renderer | Puppeteer | If you need pixel-perfect CSS rendering that @react-pdf/renderer can't match (e.g., complex CSS grid layouts, print media queries). Trade-off: heavy Chrome dependency, slower. |
| TipTap | Lexical | If you want tighter Meta ecosystem integration or need collaborative editing (Lexical has better real-time collab story). TipTap has more mature extension ecosystem for document editing. |
| Better Auth | Clerk | If you want a fully managed auth service (no self-hosted auth server). Clerk costs money at scale and adds vendor lock-in. Better Auth keeps auth in your codebase. |
| Drizzle ORM | Prisma | If you prefer Prisma's more abstracted query API and don't mind the heavier binary engine. Prisma has better GUI tools (Prisma Studio vs Drizzle Studio). Drizzle is lighter and faster. |
| SQLite | PostgreSQL from day 1 | If you plan to deploy to a platform that requires PostgreSQL (Vercel, Railway). SQLite only works in serverless with caveats (Turso, Cloudflare D1). |
| uploadthing | S3 + presigned URLs | If you need full control over storage costs at scale or have compliance requirements. More operational overhead but cheaper at high volume. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| jsPDF | Low-level API (manual x/y positioning). No layout engine. Painful for multi-page documents with headers, footers, page numbers. | @react-pdf/renderer — React-based layout with auto page breaks |
| Slate editor | API churn, stability issues. Community has largely moved to TipTap and Lexical. | TipTap — stable ProseMirror foundation, active ecosystem |
| Editor.js | Block-based JSON output is hard to convert to PDF. Limited extensibility for book-specific nodes. | TipTap — HTML output integrates naturally with PDF generation |
| Prisma (for this project) | Heavier binary engine, slower cold starts in serverless. Overkill for a personal tool that starts with SQLite. | Drizzle ORM — lighter, works great with SQLite, seamless PostgreSQL migration |
| NextAuth/Auth.js (for new projects) | Auth.js team explicitly recommends Better Auth for new projects. Auth.js is in maintenance mode. | Better Auth — the successor, more features, active development |
| AWS SDK directly for S3 | Complex configuration, IAM management, presigned URL generation. Overkill for initial launch. | uploadthing — typesafe, free tier, designed for Next.js |
| CSS-in-JS (styled-components, emotion) | Runtime overhead. Conflicts with Tailwind. Unnecessary when Tailwind handles all styling. | Tailwind CSS + cn() utility for conditional styles |
## Stack Patterns by Variant
- Use SQLite with better-sqlite3
- Local filesystem for file storage
- Simple email/password auth (or even no auth initially)
- Drizzle Kit `push` for instant schema changes (no migration files needed)
- Use PostgreSQL (Neon or Supabase for managed)
- uploadthing for file storage from day 1
- Better Auth with social sign-on providers
- Drizzle Kit `generate` + `migrate` for versioned migrations
- Add Puppeteer as a fallback PDF engine for edge cases
- Use it only when @react-pdf/renderer can't match the required output
- Run Puppeteer in a separate worker/serverless function to avoid blocking
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 15.5 | React 19.x | Next.js 15.1+ has stable React 19 support |
| @react-pdf/renderer 4.x | React 18/19 | Requires React 18+ |
| TipTap 3.x | React 18/19, Vue 3, Svelte, plain JS | Framework-agnostic via adapters |
| Drizzle ORM 0.45.x | Node 18+, Bun 1.2+ | Works in both runtimes |
| mammoth 1.12.0 | Node 12+, Browser | Works server-side and client-side |
| Better Auth | Next.js 13+, any framework | Framework-agnostic via adapters |
| pdf-lib 1.17.1 | Node, Browser, Deno, React Native | Universal JS environment support |
| uploadthing | Next.js 13+ (App Router) | Designed for Next.js specifically |
## Sources
- https://nextjs.org/blog — Next.js 15.5 (Aug 2025), Next.js 16 (Oct 2025), Next.js 16.2 (Mar 2026) [HIGH confidence — official]
- https://tiptap.dev/docs/editor/introduction — TipTap 3.x documentation [HIGH confidence — official]
- https://react-pdf.org/ — @react-pdf/renderer v4 documentation, advanced features [HIGH confidence — official]
- https://pptr.dev/ — Puppeteer 24.40.0 documentation [HIGH confidence — official]
- https://www.npmjs.com/package/mammoth — mammoth 1.12.0, 2.7M weekly downloads [HIGH confidence — official registry]
- https://www.npmjs.com/package/pdf-lib — pdf-lib 1.17.1 [MEDIUM confidence — published 4 years ago but stable]
- https://better-auth.com/blog/authjs-joins-better-auth — Auth.js joins Better Auth (Sep 2025) [HIGH confidence — official announcement]
- https://better-auth.com/docs/introduction — Better Auth features and framework support [HIGH confidence — official]
- https://uploadthing.com/ — Uploadthing features and pricing [MEDIUM confidence — official site]
- https://orm.drizzle.team/ — Drizzle ORM 0.45.x documentation, v1.0 beta progress [HIGH confidence — official]
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
