# METAx — The network was always an asset

A single-page cinematic marketing site for a fictional tokenized-equity hub,
built in the tone and visual language of a late-night Fincher film: crushed
blacks, cold blue mids, sodium practicals, heavy grain, and edits that cut
rather than glide.

Everything on the page is original. There are no Meta or Facebook marks, no
film stills, and no copyrighted text — the era and the mood are evoked, not
reproduced.

## Stack

- **Next.js 16** (App Router) + TypeScript + **Tailwind CSS v4**
- **React Three Fiber** / drei / three.js for all 3D
- **GSAP + ScrollTrigger** for scroll choreography, **Lenis** for smooth scroll
- **Framer Motion** for UI micro-interactions
- **@react-three/postprocessing** — bloom, chromatic aberration, grain, vignette

## The five scenes

| Scene | File | What it does |
| --- | --- | --- |
| Hero globe | `components/three/GlobeScene.tsx` | ~2,400 instanced nodes on a sphere, wired by nearest-neighbour edges. Expanding rings sweep across the surface as if requests were propagating. Mouse tilts it with inertia; the camera dollies and parallaxes on its own. |
| Social graph | `components/three/GraphScene.tsx` | A preferential-attachment graph laid out force-directed at mount. Scroll grows it from one node to ~160 glassy spheres, edges drawing themselves in. Hovering a node lights its neighbourhood. |
| Glass cards | `components/three/GlassCards.tsx` | Six transmission-material slabs that tilt toward the cursor and reorder in depth as you scroll. Faces are canvas textures drawn with the page's own webfonts. |
| Rain on glass | `components/three/RainGlass.tsx` | A fragment shader. The backdrop is analytic, so it can be sampled blurred across the pane and sharp inside each droplet — that contrast is what reads as glass. |
| CRT terminal | `components/three/CRTScene.tsx` | A 2004-ish tube typing out a fake session onto a canvas texture, its phosphor spilling onto the desk. |

## Structure

```
app/            layout, globals.css (design tokens), page.tsx
components/
  sections/     one file per page section
  three/        every 3D scene, plus the shared canvas wrapper
  ui/           preloader, cursor, nav, ticker, buttons, audio toggle
hooks/          every GSAP timeline and scroll behaviour
lib/            content model, graph generation, three.js maths
```

## Two things worth knowing before editing a scene

**Uniforms must be written through a material ref.** React Three Fiber copies
the `{ value }` holder objects when it applies the `uniforms` prop, so mutating
the memoised object you passed in leaves number-valued uniforms frozen at their
initial value. Object-valued uniforms (`Color`, `Vector4`) keep working by
reference, which makes the failure look intermittent. Write
`materialRef.current.uniforms.uFoo.value = x` inside `useFrame`.

**Geometry belongs in JSX, not the `geometry` prop.** A prebuilt
`BufferGeometry` handed in via `geometry={...}` is disposed on React's
StrictMode remount and never re-uploads, so the object silently renders
nothing. Declare `<bufferGeometry>` with `<bufferAttribute>` children instead.

## Performance

Lighthouse on the production build, desktop preset: **97 performance, 100
accessibility, 100 best practices, 100 SEO** (LCP 0.6s, TBT 60ms, CLS 0).

Three.js and react-three-fiber are kept out of the initial bundle behind
`components/three/LazyCanvas.tsx`. Each scene mounts only once its section has
intersected, and its render loop pauses when it scrolls away. Resolution
adapts down when frames slip. Mobile gets lower node counts, no transmission,
and no chromatic aberration.

`prefers-reduced-motion` is respected throughout: no smooth scrolling, no pins,
no scrubs, no drifting cameras, no ticker, and counters jump to their final
value.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm run start
```

## Disclaimer

METAx is not a real product. This is a concept site: every price, figure and
attestation is illustrative, the signup form has no backend and stores nothing,
and nothing here is financial advice or an offer to sell securities. It is not
affiliated with, endorsed by, or connected to Meta Platforms, Inc., and is not
associated with any film or its rights holders.
