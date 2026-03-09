---
title: Docs Tooling — VitePress vs. Starlight
description: Why Starlight was chosen for the manual.
---

# Docs Tooling: VitePress vs. Starlight

Context document for DocumentFlow Suite: why Starlight was chosen for the manual. Merged from VitePress vs. Starlight – A Comparison.

---

## 1. The choice in short

- **VitePress:** Sleek, specialized, zero-config, Vue-centric.
- **Starlight:** Versatile, framework-agnostic, multi-framework showcase.

For a **modular component library** that may be sold to companies on different tech stacks, **Starlight** is the better fit: you can show the same component running in React, Vue, Svelte, or Lit on the same site.

---

## 2. VitePress: the sleek minimalist

Built by the Vue/Vite team; successor to VuePress—very fast, zero-config, simplicity-focused.

**Pros:**

- **Speed:** Very fast build; "Instant Server Start"; edits appear almost as you type.
- **Vue integration:** Use Vue components directly in Markdown.
- **Search:** Excellent built-in local search, zero config.
- **Theme:** Default theme is professional (used by Vite and Vue core teams).

**Cons:**

- **Framework lock-in:** Tied to the Vue ecosystem.
- **Customization:** Zero-config can make layout or custom logic harder if you deviate.

---

## 3. Starlight: the versatile powerhouse

Documentation framework on top of **Astro**. Astro uses "Islands Architecture"—mix technologies on one site.

**Pros:**

- **Framework agnostic:** Render React, Vue, Svelte, and Lit (Web Components) on the same page. Ideal for a white-label component sold across the industry.
- **Performance:** Astro strips unused JS; only the code needed for each page is sent.
- **Scalability:** Astro plugin ecosystem (sitemaps, SEO, image optimization).
- **Design system:** Strong i18n and complex sidebars.

**Cons:**

- **Learning curve:** More concepts (e.g. Astro Islands).
- **Setup:** Not zero-config; more time in config at the start.

---

## 4. Comparison table

| Feature | VitePress | Starlight (Astro) |
|---------|-----------|-------------------|
| Core tech | Vite + Vue 3 | Vite + Astro (multi-framework) |
| Component support | Vue only | Any (React, Vue, Svelte, Lit) |
| Setup time | Instant (zero-config) | Quick (guided CLI) |
| Customizability | Medium (theming can be rigid) | High (very flexible) |
| Future-proofing | High (Vue core team) | Highest (framework-independent) |
| Search | Built-in (local) | Built-in (Pagefind—industry leading) |

---

## 5. Verdict for DocumentFlow

- **Use VitePress** if you want a simple, clean personal manual online quickly.
- **Use Starlight** if you want a **product showcase** that proves the tool works across the entire industry.

With Starlight, you can have a demo page where the user sees the component in React, then in Vue—removing the "does this work with our stack?" doubt. The project uses **Starlight** for the manual.

---

*Source docx: VitePress vs. Starlight – A Comparison.*
