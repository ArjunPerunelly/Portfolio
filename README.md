# Arjun Perunelly — Portfolio

A responsive portfolio for an Electronics and Computer Engineering student. Its palette uses the supplied colors: `#0D1B2A`, `#1B263B`, `#415A77`, `#778D7A`, `#D4C4A8`, and `#F4F1DE`. The dotted texture, oversized sans-serif type, compact icon navigation, project case file, skill cards, and dark contact panel take visual direction from [the reference site](https://xo-aditya.web.app/). The implementation keeps Arjun’s own content and identity. Built with plain HTML, CSS, and JavaScript; it has no build step or package dependencies.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server. Google Fonts are loaded from Google Fonts; the page falls back to system fonts if they are unavailable.

## Publish with GitHub Pages

This site is ready to publish from the repository root:

1. Push the project files to a GitHub repository.
2. Open the repository’s **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the publishing branch and the `/(root)` folder, then save.

GitHub Pages serves `index.html` directly. No build command or framework configuration is needed. See the [GitHub Pages documentation](https://docs.github.com/en/pages).

## Content notes

- The featured project links to the public [Neko repository](https://github.com/ArjunPerunelly/neko).
- Project technologies are listed based on the repository files.
- The Neko system map is a diagram of verified technologies; no project screenshot was available in the portfolio assets.
- No live demo is linked. The contact email and LinkedIn profile were supplied by Arjun for this portfolio.
- To update the page, edit `index.html`, `styles.css`, and `script.js` in the repository root.

## Motion and animation sources

The portfolio's motion is implemented locally in `styles.css` and `script.js`. It includes a staggered hero entrance, one-time `IntersectionObserver` reveals, section rules that draw in as they enter view, a vertical page-progress rail, a gentle scroll cue, and restrained link and project hover states. The skills strip is a custom CSS marquee built from skills already listed on the page; it uses a constant-speed transform, pauses on hover for fine pointers, and has a keyboard- and touch-operable pause control. The strip is hidden when reduced motion is requested. No animation library, build step, or package dependency is required.

The viewport-wide magnetic line field is a custom Canvas 2D effect that responds to fine-pointer movement. Additional effects use a soft hover spotlight on the existing skills grid and a rounded-rectangle sage border highlight whose brightest point follows the pointer around the project card, skill/contact cards, the Neko system map, and CTA/navigation controls. CTA buttons use matching rounded corners. Keyboard focus shows a still highlight. These take broad interaction cues from React Bits' MagicBento, BorderGlow, and SpecularButton references, but are independently written CSS rather than copies or ports of their component source. The supplied components use React (MagicBento also lists Hugeicons), and SpecularButton uses WebGL2; this static implementation adds no packages and uses no WebGL. Pointer tracking is limited to the page-wide magnetic field and bordered elements, and disabled for touch-only and reduced-motion environments. Reduced-motion preferences show a static border highlight and remove the added sheen transition. React Bits' [MIT + Commons Clause license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) permits use in products but prohibits redistribution of the components and ported versions; no React Bits code or dependency is included.

### Animmaster Lib review

Reviewed on 2026-10-24: [Animmaster Lib's public catalog](https://animmasterlib.dev/) advertises scroll, hero, text, hover, navigation, slider, WebGL, and other animation categories; its scroll page lists 71 scroll animations, 24 hero animations, 21 hover effects, and 18 text animations. Individual preview captions are generic, not component/API names. The reviewed public pages provide preview media but no component source, API, CDN, or component-specific setup instructions. The FAQ says the code is delivered in a Google Drive folder after a one-time purchase, can be copied into a project, and is split across HTML/CSS/JS (60%), React (30%), and Next.js (10%). As a result, dependencies and setup requirements for any particular component cannot be verified without its source bundle.

The [terms](https://animmasterlib.dev/terms) say a purchase grants a non-exclusive, non-transferable license for personal and commercial projects, while prohibiting redistribution of the library/source files and sharing purchased files. No open-source license is stated there.

No Animmaster component or dependency is included in this repository. The public previews were not treated as source code, and no undocumented attributes or APIs were guessed. Before adding a purchased component to a public GitHub repository, clarify with the vendor whether that public source distribution is permitted under the terms. If an authorized source bundle becomes available and that point is resolved, inspect its individual dependencies and licensing before integration; until then, the local HTML/CSS/JavaScript effects above remain self-contained.
