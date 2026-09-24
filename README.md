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
| Social graph | `components/three/GraphScene.tsx` | A preferential-attachment graph laid out force-directed at mount. Scroll grows it from one node to ~160 profile pictures, edges drawing themselves in. Hovering one lights its neighbourhood in amber and steps everything else back. |
| Payout fan | `components/three/PayoutScene.tsx` | The contract at the centre, spokes running out to holder avatars. Packets travel each spoke on a per-spoke phase and the holder flares as one lands — all computed in the shader from one clock, so the CPU does nothing per frame. |
| Rain on glass | `components/three/RainGlass.tsx` | A fragment shader. The backdrop is analytic, so it can be sampled blurred across the pane and sharp inside each droplet — that contrast is what reads as glass. |
| CRT terminal | `components/three/CRTScene.tsx` | A 2004-ish tube typing out a fake session onto a canvas texture, its phosphor spilling onto the desk. |

Scenes are framed by `components/three/FitCamera.tsx`, which pulls the camera
back far enough that the content fits whatever aspect ratio its panel turns out
to be, and re-derives that every frame so nothing can knock it out of sync. It
also takes a `depth` for anything that travels toward the camera, since moving
forward magnifies content out of a frame measured at rest.

## The faces

The nodes wear generated profile pictures, not real ones. `lib/avatars.ts`
draws 64 variants onto a single canvas atlas — default head-and-shoulders
silhouettes, initials tiles for the people who never uploaded anything, and
out-of-focus photo-ish tiles — and the graph samples it per instance with a UV
offset, so the whole network stays one draw call. Nobody's actual photograph is
used anywhere on this site.

The discs are billboarded in the vertex shader rather than rotated on the CPU,
which means a geometry raycast would miss them entirely. Hover is resolved in
screen space instead: project every node centre, compare against the pointer in
NDC, take the nearest within its projected radius.

## The distributions feed

`app/api/payouts/route.ts` reads the payout wallet's METAx transfers straight
from Solana mainnet and serves them as the ledger in the Distributions section.
Every transaction in which the payout wallet's METAx balance went *down* is a
round; every other owner whose balance went *up* in it is a recipient. Reading
balance deltas rather than instructions keeps it independent of transaction
version and batching. Cached with a two-minute revalidation, because the free
RPC throttles per method; if the read fails the route serves an empty feed with
`degraded: true` rather than failing a build. Wallet and mints live in
`lib/chain.ts` with env overrides (`PAYOUT_WALLET`, `TOKEN_MINT`,
`TOKEN_SYMBOL`, `RPC_URL`) for the real launch.

The chain side — Meteora DBC launch tooling and the keeper that claims fees and
pays holders — lives in a separate local-only project, not in this repo.

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

**A full-bleed overlay eats every pointer event.** The pinned chapter copy sits
in a `z-10` container covering the whole canvas. Transparent or not, it
swallowed every `pointermove` before the graph could see one, so node hover
silently did nothing. Any non-interactive layer sitting over a canvas needs
`pointer-events-none`.

**postprocessing resizes the canvas element, and nothing puts it back.** When
`EffectComposer` mounts it calls `renderer.setSize()`, and three writes those
dimensions straight onto the canvas as an inline width/height. Get the wrong
numbers and the canvas overflows its panel — you are then looking at the
top-left corner of a much larger render, which reads as a wildly over-zoomed
scene. r3f only re-applies its own size when that size *changes*, so nothing
corrects it. `CanvasSizeGuard` in `SceneCanvas.tsx` re-asserts the measured
size whenever the element drifts.

Worth knowing how this presents: it only bites the one canvas that is not
already full-bleed, it appears on scroll-in rather than on load, and it does
not reproduce from `scrollIntoView` in a test — you have to scroll the page the
way a reader does. Measure the canvas rect against its container rather than
trusting how it looks.

**A grid or flex child needs `min-w-0` around a scrollable table.** Grid items
default to `min-width: auto`, so the ledger's `min-w-[520px]` stretched its
whole column to 520px on a 390px viewport. `overflow-x: hidden` on the body hid
the damage, and an overflow check passed while the 3D panel beside it was
silently pushed off-centre.

**Geometry belongs in JSX, not the `geometry` prop.** A prebuilt
`BufferGeometry` handed in via `geometry={...}` is disposed on React's
StrictMode remount and never re-uploads, so the object silently renders
nothing. Declare `<bufferGeometry>` with `<bufferAttribute>` children instead.

## Performance

Lighthouse on the production build, desktop preset: **97-98 performance, 100
accessibility, 100 best practices, 100 SEO** (LCP 0.6s, CLS 0).

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

METAx is not a real product. There is no token, no market, no custody
arrangement and no reserve, and nothing here is financial advice or an offer to
sell securities. There is no footer — the disclaimer lives in
`components/ui/LegalStrip.tsx` at the foot of the page, and it needs to stay
there: the site names Meta throughout and shows a simulated payment ledger.

Historical dates and figures about Facebook and Meta are drawn from the
company's own disclosures and contemporaneous reporting and are included as
factual reference. Every METAx figure is invented. The faces in the network are
generated artwork.

This site is independent. It is not affiliated with, endorsed by, or connected
to Meta Platforms, Inc. or any of its products, and is not associated with any
film or its rights holders. No Meta or Facebook logos, trademarks or assets are
used.
