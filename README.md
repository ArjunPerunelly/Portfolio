# Arjun Perunelly — Portfolio

A responsive portfolio for an Electronics and Computer Engineering student, using a refined charcoal, warm-white, and muted-green visual system with editorial spacing, crisp project surfaces, and restrained motion. Built with plain HTML, CSS, and JavaScript; it has no build step or package dependencies.

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
- The temporary professional email is linked in the contact section and footer. LinkedIn appears in the navigation, hero, contact section, and footer.
- To update the page, edit `index.html`, `styles.css`, and `script.js` in the repository root.

## Motion and animation sources

The portfolio's motion is implemented locally in `styles.css` and `script.js`. It includes a hero text entrance, one-time `IntersectionObserver` reveals, a divider draw, a page scroll-progress bar, a gentle scroll cue, and restrained link and project hover states. The skills strip is a custom CSS marquee built from skills already listed on the page; it uses a constant-speed transform, pauses on hover for fine pointers, and has a keyboard- and touch-operable pause control. The strip is hidden when reduced motion is requested. No animation library, build step, or package dependency is required.

### Animmaster Lib review

Reviewed on 2026-10-24: [Animmaster Lib's public catalog](https://animmasterlib.dev/) advertises scroll, hero, text, hover, navigation, slider, WebGL, and other animation categories; its scroll page lists 71 scroll animations, 24 hero animations, 21 hover effects, and 18 text animations. Individual preview captions are generic, not component/API names. The reviewed public pages provide preview media but no component source, API, CDN, or component-specific setup instructions. The FAQ says the code is delivered in a Google Drive folder after a one-time purchase, can be copied into a project, and is split across HTML/CSS/JS (60%), React (30%), and Next.js (10%). As a result, dependencies and setup requirements for any particular component cannot be verified without its source bundle.

The [terms](https://animmasterlib.dev/terms) say a purchase grants a non-exclusive, non-transferable license for personal and commercial projects, while prohibiting redistribution of the library/source files and sharing purchased files. No open-source license is stated there.

No Animmaster component or dependency is included in this repository. The public previews were not treated as source code, and no undocumented attributes or APIs were guessed. Before adding a purchased component to a public GitHub repository, clarify with the vendor whether that public source distribution is permitted under the terms. If an authorized source bundle becomes available and that point is resolved, inspect its individual dependencies and licensing before integration; until then, the local HTML/CSS/JavaScript effects above remain self-contained.
