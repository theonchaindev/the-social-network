"""
Brand plates for The Social Network.

There is no logo. The brand is two things the site actually renders: rain on
glass, and the avatar network. Both are ported here from the real sources —
the refraction maths from components/three/RainGlass.tsx, the avatar tiles and
graph layout from lib/avatars.ts and lib/graph.ts — so a plate and the site
cannot drift apart.

Run: python3 scripts/brand.py   (fonts fetched into scripts/fonts/)
"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = "public/brand"
TOKEN_OUT = "public/token"
COLD_100 = (195, 204, 217); COLD_300 = (110, 125, 147); COLD_350 = (132, 150, 171)
AMBER = (232, 163, 61); AMBER_SOFT = (242, 197, 132); FB = (59, 89, 152)
INK = (5, 7, 13); INK_RAISE = (17, 23, 37); TEAL = (23, 56, 63)


def font(name, size, weight="Regular"):
    f = ImageFont.truetype(f"scripts/fonts/{name}.ttf", size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f


def grain(img, amount=0.055, seed=3):
    """The site's film grain: fine, constant, slightly cold."""
    rng = np.random.default_rng(seed)
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    n = rng.normal(0, 255 * amount, a.shape[:2])[:, :, None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))


def vignette(img, strength=0.55):
    w, h = img.size
    y, x = np.mgrid[0:h, 0:w]
    u = (x / w - 0.5) * (w / h); v = y / h - 0.5
    d = np.sqrt(u * u + v * v) / 0.72
    m = np.clip(1.0 - strength * np.clip(d - 0.35, 0, None) ** 1.6, 0, 1)
    a = np.asarray(img.convert("RGB"), dtype=np.float32) * m[:, :, None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


# ---------------------------------------------------------------- rain on glass
def _backdrop(u, v, aspect, t=0.0):
    """Out-of-focus sodium practicals and cold window light. Ported from the
    shader, but spread wider and dimmer: a droplet refracting flat black shows
    nothing, so the pane needs light everywhere for the drops to read."""
    col = np.stack([
        np.full_like(v, 0.012) + (0.030 - 0.012) * v,
        np.full_like(v, 0.018) + (0.060 - 0.018) * v,
        np.full_like(v, 0.030) + (0.075 - 0.030) * v,
    ], axis=-1)
    n = 14
    for i in range(n):
        px = ((i * 0.618 + 0.11) % 1.0) * 1.06 - 0.03 + 0.06 * math.sin(t * 0.05 + i * 2.1)
        py = 0.08 + 0.84 * ((i * 0.383 + 0.17) % 1.0)
        rad = 0.11 + 0.07 * ((i * 0.271 + 0.5) % 1.0)
        d = np.sqrt(((u - px) * aspect) ** 2 + (v - py) ** 2)
        g = np.clip((rad - d) / rad, 0, 1); g = g * g * (3 - 2 * g)
        c = (0.95, 0.63, 0.24) if i % 2 == 0 else (0.20, 0.42, 0.62)
        col = col + np.array(c) * (g * g * 0.42)[:, :, None]
    return col


def _hash21(x, y):
    p = np.stack([(x * 233.34) % 1.0, (y * 851.73) % 1.0], -1)
    s = p[..., 0] * p[..., 0] + p[..., 1] * p[..., 1] + 23.45
    p = (p + s[..., None]) % 1.0
    return (p[..., 0] * p[..., 1]) % 1.0


def _drop_layer(u, v, gx, gy, seed, t, speed):
    """One grid of running droplets; returns coverage and the refraction offset."""
    g_u, g_v = u * gx, v * gy
    idx, idy = np.floor(g_u), np.floor(g_v)
    st_u, st_v = g_u - idx - 0.5, g_v - idy - 0.5
    h = _hash21(idx + seed, idy + seed)
    h2 = _hash21(idx + seed + 41.7, idy + seed + 41.7)
    live = h2 >= 0.45

    phase = (t * speed * (0.5 + h2) + h) % 1.0
    fall = phase * phase * (3 - 2 * phase)
    px, py = (h - 0.5) * 0.55, 0.5 - fall
    r = 0.10 + h2 * 0.13
    du, dv = (st_u - px) * (gx / gy), st_v - py
    dist = np.sqrt(du * du + dv * dv)
    drop = np.clip((r - dist) / np.maximum(r * 0.55, 1e-6), 0, 1)
    drop = drop * drop * (3 - 2 * drop)

    # Trail above the drop. The shader's hard step() is softened here and the
    # tail faded out before the cell boundary, or it clips into a rectangle.
    rise = np.clip((st_v - py) / (r * 0.6), 0, 1)
    fade = np.clip((0.5 - (st_v - py)) / 0.5, 0, 1) ** 1.6
    cell_edge = np.clip((0.5 - np.abs(st_v)) / 0.16, 0, 1)
    across = np.clip((r * 0.5 - np.abs(du)) / np.maximum(r * 0.5, 1e-6), 0, 1)
    across = across * across * (3 - 2 * across)
    trail = across * rise * fade * cell_edge * 0.40

    drop = drop * live; trail = trail * live
    return np.clip(drop + trail * 0.5, 0, 1), -du * drop * 0.55, -dv * drop * 0.55


def rain(w, h, t=11.0, seed=0, intensity=1.0):
    """
    Rain on a window. The backdrop is rendered once, then genuinely blurred for
    the pane; each droplet samples the *sharp* version at a refracted offset.
    That contrast between a soft pane and a sharp lens is what reads as glass —
    averaging a few nearby samples, as the shader does, is too subtle at print
    size.
    """
    aspect = w / h
    y, x = np.mgrid[0:h, 0:w]
    u, v = x / w, 1.0 - y / h

    cover = np.zeros_like(u); ru = np.zeros_like(u); rv = np.zeros_like(u)
    for (gx, gy, sp, sd, wgt) in [(6, 4, 0.10, 0.0, 1.0), (11, 7, 0.16, 19.3, 0.85),
                                  (19, 12, 0.05, 77.1, 0.6), (31, 20, 0.02, 131.7, 0.4)]:
        c, a, b = _drop_layer(u, v, gx, gy, sd + seed, t, sp)
        cover = np.maximum(cover, c * wgt); ru += a * wgt; rv += b * wgt
    cover = np.clip(cover, 0, 1) * intensity
    ru *= intensity; rv *= intensity

    sharp = np.clip(_backdrop(u, v, aspect, t) * 255, 0, 255).astype(np.uint8)
    pane = np.asarray(
        Image.fromarray(sharp).filter(ImageFilter.GaussianBlur(min(w, h) * 0.022)),
        dtype=np.float32,
    ) / 255.0

    # Gather the sharp backdrop at the refracted coordinate.
    sx = np.clip((x + ru * w * 1.6).astype(np.int32), 0, w - 1)
    sy = np.clip((y - rv * h * 1.6).astype(np.int32), 0, h - 1)
    lens = sharp[sy, sx].astype(np.float32) / 255.0

    col = pane * (1 - cover[:, :, None]) + lens * cover[:, :, None]

    # Bright meniscus where the droplet meets the pane, and a soft lift inside.
    edge = np.clip(np.sqrt(ru * ru + rv * rv) * 14.0, 0, 1) * cover
    col += np.array([0.62, 0.70, 0.82]) * (edge * 0.42)[:, :, None]
    col += np.array([0.10, 0.13, 0.17]) * (cover * 0.30)[:, :, None]

    img = Image.fromarray(np.clip(col * 255, 0, 255).astype(np.uint8))
    return grain(vignette(img, 0.6), 0.05, seed + 7)


# ------------------------------------------------------------------- the network
GROUNDS = ["#2e4356", "#35505f", "#243a4d", "#3d4f63", "#46566b", "#2a4a4e",
           "#4a5468", "#5b4a3a", "#3a4a5e", "#27384a", "#514c5e", "#1f3340"]
INITIALS = "ABCDEFGHIJKLMNOPRSTWZ"


def _shade(hex_colour, amount):
    n = int(hex_colour[1:], 16)
    r, g, b = (n >> 16) & 255, (n >> 8) & 255, n & 255
    f = lambda c: int(c + (255 - c) * amount) if amount > 0 else int(c * (1 + amount))
    return (max(0, min(255, f(r))), max(0, min(255, f(g))), max(0, min(255, f(b))))


def _silhouette(d, size, colour, rand):
    """The head-and-shoulders every default avatar has ever used."""
    cx = size / 2
    head_r = size * (0.185 + rand() * 0.022)
    head_y = size * (0.37 + rand() * 0.025)
    d.ellipse((cx - head_r, head_y - head_r, cx + head_r, head_y + head_r), fill=colour)
    ry = size * (0.40 + rand() * 0.06); rx = size * (0.335 + rand() * 0.04)
    cy = size * (1.04 + rand() * 0.05)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=colour)


def avatar_tile(size, rand, mono):
    """One profile picture: silhouette, initials, or an out-of-focus photo."""
    img = Image.new("RGB", (size, size), INK)
    d = ImageDraw.Draw(img)
    ground = GROUNDS[int(rand() * len(GROUNDS))]
    roll = rand()

    if roll < 0.18:
        d.rectangle((0, 0, size, size), fill=ground)
        f = font("JetBrainsMono", int(size * 0.34), "Medium")
        txt = INITIALS[int(rand() * len(INITIALS))] + INITIALS[int(rand() * len(INITIALS))]
        d.text((size / 2, size / 2), txt, font=f, fill=_shade(ground, 0.55), anchor="mm")
    elif roll < 0.52:
        warm = rand() > 0.5
        top = (125, 90, 51) if warm else (39, 86, 107)
        bot = (29, 28, 34) if warm else (27, 39, 51)
        ramp = np.linspace(0, 1, size)[:, None]
        a = (np.array(top) * (1 - ramp) + np.array(bot) * ramp)[:, None, :].repeat(size, 1)
        img = Image.fromarray(a.astype(np.uint8)); d = ImageDraw.Draw(img)
        bok = Image.new("RGB", (size, size), (0, 0, 0)); bd = ImageDraw.Draw(bok)
        for _ in range(3):
            bx, by = size * rand(), size * rand(); br = size * (0.12 + rand() * 0.2)
            bd.ellipse((bx - br, by - br, bx + br, by + br),
                       fill=(200, 150, 80) if warm else (110, 160, 200))
        img = Image.blend(img, ImageChops_screen(img, bok.filter(ImageFilter.GaussianBlur(size * 0.12))), 0.55)
        d = ImageDraw.Draw(img)
        _silhouette(d, size, (9, 14, 20), rand)
    else:
        d.rectangle((0, 0, size, size), fill=ground)
        light = rand() > 0.32
        _silhouette(d, size, _shade(ground, 0.58 if light else -0.62), rand)

    v = Image.new("L", (size, size), 0)
    ImageDraw.Draw(v).ellipse((-size * 0.15, -size * 0.15, size * 1.15, size * 1.15), fill=110)
    img = Image.composite(img, Image.new("RGB", (size, size), (4, 7, 13)), v.filter(ImageFilter.GaussianBlur(size * 0.3)).point(lambda p: 255 - int(p * 0.45)))
    return img


def ImageChops_screen(a, b):
    from PIL import ImageChops
    return ImageChops.screen(a, b)


def circular(img):
    size = img.size[0]
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4, size * 4), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def build_graph(count, seed=7):
    """Preferential attachment, then a radial layout. Ported from lib/graph.ts.

    Returns positions normalised into roughly [-1, 1], the edges, each node's
    degree, and the index of the hub the drawing is rooted on.
    """
    s = [seed]
    def rand():
        s[0] = (s[0] * 1664525 + 1013904223) % 4294967296
        return s[0] / 4294967296

    edges = []
    degree = [0] * count
    neighbours = [[] for _ in range(count)]
    for i in range(1, count):
        links = 1 if i < 4 else (2 if rand() < 0.35 else 1)
        chosen = set()
        for _ in range(links):
            total = sum(degree[j] + 1 for j in range(i))
            pick = rand() * total
            target = 0
            for j in range(i):
                pick -= degree[j] + 1
                if pick <= 0:
                    target = j
                    break
            if target not in chosen:
                chosen.add(target)
                edges.append((i, target))
                degree[i] += 1
                degree[target] += 1
                neighbours[i].append(target)
                neighbours[target].append(i)

    # Root on the most-connected node: preferential attachment does not
    # guarantee node 0 becomes the hub.
    hub = max(range(count), key=lambda i: degree[i])
    depth = [-1] * count
    parent = [-1] * count
    depth[hub] = 0
    order = []
    queue = [hub]
    head = 0
    while head < len(queue):
        node = queue[head]; head += 1
        order.append(node)
        for nxt in neighbours[node]:
            if depth[nxt] != -1:
                continue
            depth[nxt] = depth[node] + 1
            parent[nxt] = node
            queue.append(nxt)
    max_depth = max(1, max(depth))
    for i in range(count):
        if depth[i] == -1:
            depth[i] = max_depth
            order.append(i)

    children = [[] for _ in range(count)]
    for i in range(count):
        if parent[i] >= 0:
            children[parent[i]].append(i)

    # A busy limb earns a wider wedge than a single leaf.
    weight = [1.0] * count
    for node in reversed(order):
        if children[node]:
            weight[node] = sum(weight[c] for c in children[node])

    angle = [0.0] * count
    stack = [(hub, 0.0, math.tau)]
    while stack:
        node, lo, hi = stack.pop()
        angle[node] = (lo + hi) / 2
        cursor = lo
        for child in children[node]:
            span = (hi - lo) * (weight[child] / weight[node])
            stack.append((child, cursor, cursor + span))
            cursor += span

    # Ring radius blends depth with population, so the sparse deep rings do not
    # pile up at the rim and the populated ones fill the disc.
    per_depth = [0] * (max_depth + 1)
    for i in range(count):
        per_depth[depth[i]] += 1
    ring = [0.0] * (max_depth + 1)
    inner, seen = 0.3, 0
    for d in range(max_depth + 1):
        seen += per_depth[d]
        t = 0.5 * (d / max_depth) + 0.5 * math.sqrt(seen / count)
        ring[d] = 0.0 if d == 0 else inner + (1 - inner) * t

    pos = np.zeros((count, 2), dtype=np.float32)
    for i in range(count):
        r = ring[depth[i]] * (0.94 + rand() * 0.12)
        a = angle[i] + (rand() - 0.5) * 0.1
        pos[i] = (math.cos(a) * r, math.sin(a) * r)
    pos[hub] = (0.0, 0.0)

    return pos, edges, degree, hub


def network(w, h, count=120, seed=7, scale=1.0, cx=0.5, cy=0.5, lit=None):
    """The graph as the site draws it: glassy avatar discs, thin cold edges."""
    img = Image.new("RGB", (w, h), INK)
    px = np.asarray(img, dtype=np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    for (gx, gy, col, rad) in [(0.82, 0.12, (120, 78, 26), 0.55), (0.12, 0.95, (18, 42, 58), 0.6)]:
        d = np.sqrt(((xx / w - gx) * (w / h)) ** 2 + (yy / h - gy) ** 2) / rad
        px += np.array(col) * np.clip(1 - d, 0, 1)[:, :, None] ** 2
    img = Image.fromarray(np.clip(px, 0, 255).astype(np.uint8))

    pos, edges, degree, hub = build_graph(count, seed)
    if lit is None:
        lit = hub  # the centre is what the mark is about
    span = min(w, h) * 0.46 * scale
    pts = [(w * cx + p[0] * span, h * cy + p[1] * span) for p in pos]

    lines = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ld = ImageDraw.Draw(lines)
    for a, b in edges:
        hot = lit is not None and (a == lit or b == lit)
        ld.line((pts[a], pts[b]), fill=(*AMBER, 190) if hot else (63, 111, 147, 90), width=2 if hot else 1)
    img = Image.alpha_composite(img.convert("RGBA"), lines)

    rand = random.Random(seed)
    tile_rand = lambda: rand.random()
    order = sorted(range(count), key=lambda i: degree[i])
    for i in order:
        r = int((34 if i == hub else max(7, min(30, 7 + degree[i] * 2.1))) * scale)
        tile = circular(avatar_tile(max(24, r * 4), tile_rand, None).resize((r * 2, r * 2), Image.LANCZOS))
        ring = Image.new("RGBA", tile.size, (0, 0, 0, 0))
        rd = ImageDraw.Draw(ring)
        hot = (i == lit)
        rd.ellipse((1, 1, r * 2 - 2, r * 2 - 2), outline=(*AMBER_SOFT, 230) if hot else (95, 130, 160, 150), width=max(1, r // 9))
        tile = Image.alpha_composite(tile, ring)
        img.alpha_composite(tile, (int(pts[i][0] - r), int(pts[i][1] - r)))

    if lit is not None:
        halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        hr = int(46 * scale)
        ImageDraw.Draw(halo).ellipse((pts[lit][0] - hr, pts[lit][1] - hr, pts[lit][0] + hr, pts[lit][1] + hr), fill=(*AMBER, 70))
        img = Image.alpha_composite(img, halo.filter(ImageFilter.GaussianBlur(hr * 0.5)))

    return grain(vignette(img.convert("RGB"), 0.5), 0.05, seed)


# ------------------------------------------------------------------------ plates
def wordmark(w=2400, h=620):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.text((40, 110), "The Social Network", font=font("Playfair", 235), fill=COLD_100 + (255,))
    d.text((48, 450), "P A Y S   O U T   I N   M E T A   S T O C K", font=font("JetBrainsMono", 40, "Medium"), fill=AMBER + (255,))
    return img


def avatar(size=400):
    img = network(size, size, count=46, seed=11, scale=0.84)
    return img


def banner(w=1500, h=500):
    img = rain(w, h, t=11.0, seed=2)
    d = ImageDraw.Draw(img)
    d.text((80, 118), "The Social", font=font("Playfair", 122), fill=COLD_100)
    d.text((80, 240), "Network", font=font("Playfair", 122), fill=COLD_100)
    d.text((84, 400), "FRIENDSHIP WAS THE INTERFACE. THE LIST WAS THE ASSET.", font=font("JetBrainsMono", 22, "Medium"), fill=COLD_350)
    return img


def og(w=1200, h=630):
    img = network(w, h, count=110, seed=5, scale=0.95, cx=0.74, cy=0.5, lit=1)
    scrim = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for i in range(w // 2):
        sd.line((i, 0, i, h), fill=(5, 7, 13, int(232 * (1 - i / (w / 2)) ** 1.15)))
    img = Image.alpha_composite(img.convert("RGBA"), scrim).convert("RGB")
    d = ImageDraw.Draw(img)
    d.text((72, 62), "●  THE SOCIAL NETWORK", font=font("JetBrainsMono", 22, "Medium"), fill=AMBER)
    for i, line in enumerate(["The network", "was always", "an asset."]):
        d.text((72, 152 + i * 104), line, font=font("Playfair", 92), fill=COLD_100)
    d.text((76, 522), "EVERY TRADE PAYS HOLDERS IN META STOCK · 70% ON-CHAIN", font=font("JetBrainsMono", 20, "Medium"), fill=COLD_350)
    return img


def payout_card(w=1080, h=1080):
    img = rain(w, h, t=23.0, seed=9, intensity=0.85)
    veil = Image.new("RGBA", (w, h), (5, 7, 13, 118))
    img = Image.alpha_composite(img.convert("RGBA"), veil).convert("RGB")
    d = ImageDraw.Draw(img)
    d.text((80, 80), "THE SOCIAL NETWORK", font=font("JetBrainsMono", 26, "Medium"), fill=COLD_350)
    d.text((80, 126), "ROUND 001 · SETTLED ON-CHAIN", font=font("JetBrainsMono", 26, "Medium"), fill=AMBER)
    d.line((80, 190, w - 80, 190), fill=(60, 72, 92), width=2)
    d.text((80, 250), "Paid out", font=font("Playfair", 72), fill=COLD_100)
    d.text((80, 352), "0.00902807", font=font("JetBrainsMono", 148, "Medium"), fill=AMBER)
    d.text((84, 522), "META STOCK  ·  METAx", font=font("JetBrainsMono", 34, "Medium"), fill=COLD_350)
    for i, (k, v) in enumerate([("HOLDERS PAID", "2"), ("SHARE TO HOLDERS", "70%"), ("FEE PER TRADE", "2%")]):
        x = 80 + i * 320
        d.text((x, 648), k, font=font("JetBrainsMono", 22, "Medium"), fill=COLD_350)
        d.text((x, 688), v, font=font("Playfair", 64), fill=COLD_100)
    d.text((80, h - 62), "the-social-network-steel.vercel.app  ·  every row is a transaction", font=font("JetBrainsMono", 20, "Medium"), fill=COLD_300)
    return img


def quote_card(w=1080, h=1080):
    img = rain(w, h, t=5.0, seed=4, intensity=0.9)
    img = Image.alpha_composite(img.convert("RGBA"), Image.new("RGBA", (w, h), (5, 7, 13, 96))).convert("RGB")
    d = ImageDraw.Draw(img)
    d.text((84, 96), "INTERSTITIAL · KIRKLAND HOUSE, 02:14", font=font("JetBrainsMono", 24, "Medium"), fill=COLD_350)
    f = font("Playfair", 104)
    for i, line in enumerate(["Friendship was", "the interface.", "The list was", "the asset."]):
        d.text((84, 330 + i * 118), line, font=f, fill=COLD_100)
    d.text((88, h - 110), "THE SOCIAL NETWORK", font=font("JetBrainsMono", 24, "Medium"), fill=AMBER)
    return img


def token_mark(size=512):
    """The square logo the token itself carries: the network, centred on its hub.

    Deliberately wordless. It is rendered at 24px in a wallet list as often as
    it is seen full size, so it has to survive as a shape.
    """
    img = network(size, size, count=44, seed=11, scale=0.80)
    return img


def palette(w=1600, h=420):
    img = Image.new("RGB", (w, h), INK); d = ImageDraw.Draw(img)
    sw = [("Ink", INK, "#05070D"), ("Ink raise", INK_RAISE, "#111725"), ("Teal shadow", TEAL, "#17383F"),
          ("Cold 300", COLD_300, "#6E7D93"), ("Cold 100", COLD_100, "#C3CCD9"), ("Amber", AMBER, "#E8A33D"),
          ("Amber soft", AMBER_SOFT, "#F2C584"), ("2004 blue", FB, "#3B5998")]
    cw = w // len(sw)
    for i, (n, c, hx) in enumerate(sw):
        d.rectangle((i * cw, 0, (i + 1) * cw, 300), fill=c)
        d.text((i * cw + 20, 322), n.upper(), font=font("JetBrainsMono", 20, "Medium"), fill=COLD_350)
        d.text((i * cw + 20, 356), hx, font=font("JetBrainsMono", 24, "Medium"), fill=COLD_100)
    return img


if __name__ == "__main__":
    print("rain plate…");    rain(1600, 900, t=11.0, seed=1).save(f"{OUT}/rain.png", optimize=True)
    print("network plate…"); network(1600, 900, count=150, seed=7, scale=0.92).save(f"{OUT}/network.png", optimize=True)
    print("avatar…");        avatar().save(f"{OUT}/avatar.png", optimize=True)
    print("banner…");        banner().save(f"{OUT}/x-banner.png", optimize=True)
    print("og…");            og().save(f"{OUT}/og.png", optimize=True)
    print("payout card…");   payout_card().save(f"{OUT}/payout-card.png", optimize=True)
    print("quote card…");    quote_card().save(f"{OUT}/quote-card.png", optimize=True)
    print("wordmark…");      wordmark().save(f"{OUT}/wordmark.png")
    print("palette…");       palette().save(f"{OUT}/palette.png", optimize=True)
    print("token mark…")
    os.makedirs(TOKEN_OUT, exist_ok=True)
    mark = token_mark()
    mark.save(f"{TOKEN_OUT}/mark.png", optimize=True)
    mark.resize((128, 128), Image.LANCZOS).save(f"{TOKEN_OUT}/mark-128.png", optimize=True)
    print("done")
