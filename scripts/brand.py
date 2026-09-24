"""
Generates the brand kit PNGs into public/brand/ using the site's own fonts.
Run: python3 scripts/brand.py   (fonts in scripts/fonts/, fetched from google/fonts)
"""
import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = "public/brand"
INK = (5, 7, 13); INK_RAISE = (17, 23, 37)
COLD_100 = (195, 204, 217); COLD_300 = (110, 125, 147); COLD_350 = (132, 150, 171)
AMBER = (232, 163, 61); AMBER_SOFT = (242, 197, 132); FB = (59, 89, 152); TEAL = (23, 56, 63)
NODE = (58, 84, 104); NODE_RIM = (120, 150, 175)

def font(name, size, weight="Regular"):
    f = ImageFont.truetype(f"scripts/fonts/{name}.ttf", size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f

def glow(img, cx, cy, r, colour, strength=0.9):
    layer = Image.new("RGB", img.size, (0, 0, 0))
    ImageDraw.Draw(layer).ellipse((cx - r, cy - r, cx + r, cy + r), fill=colour)
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    return Image.blend(img, Image.composite(layer, img, layer.convert("L").point(lambda v: min(255, int(v * 1.6)))), strength)

def grain(img, n=None, amp=9):
    px = img.load(); w, h = img.size; n = n or (w * h) // 9
    for _ in range(n):
        x, y = random.randrange(w), random.randrange(h); p = px[x, y]; k = random.randint(-amp, amp)
        px[x, y] = tuple(max(0, min(255, c + k)) for c in p[:3]) + tuple(p[3:])
    return img

def spokes(d, cx, cy, radius, count, seed=7, node=13, hub=28, jitter=0.08, line=(52, 86, 110)):
    random.seed(seed)
    pts = []
    for i in range(count):
        a = i * 2 * math.pi / count + random.uniform(-jitter, jitter)
        r = radius * random.uniform(0.86, 1.0)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    for p in pts: d.line((cx, cy, p[0], p[1]), fill=line, width=max(2, node // 6))
    for p in pts:
        d.ellipse((p[0] - node, p[1] - node, p[0] + node, p[1] + node), fill=NODE, outline=NODE_RIM, width=max(2, node // 6))
    d.ellipse((cx - hub, cy - hub, cx + hub, cy + hub), fill=AMBER, outline=AMBER_SOFT, width=max(3, hub // 9))

def base(w, h):
    img = Image.new("RGB", (w, h), INK)
    img = glow(img, int(w * 0.82), int(h * 0.1), int(min(w, h) * 0.55), (120, 78, 26), 0.85)
    img = glow(img, int(w * 0.12), int(h * 0.95), int(min(w, h) * 0.6), (18, 42, 58), 0.85)
    return img

def mark(size=1024, transparent=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent else INK + (255,))
    d = ImageDraw.Draw(img)
    spokes(d, size / 2, size / 2, size * 0.36, 11, node=int(size * 0.026), hub=int(size * 0.058), line=(80, 118, 146))
    return img

def wordmark(w=2400, h=600):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    f = font("Playfair", 230); d.text((40, 120), "The Social Network", font=f, fill=COLD_100 + (255,))
    m = font("JetBrainsMono", 40, "Medium"); d.text((48, 440), "P A Y S   O U T   I N   M E T A   S T O C K", font=m, fill=AMBER + (255,))
    return img

def avatar(size=400):
    img = base(size, size)
    m = mark(int(size * 0.86)); img.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
    return grain(img)

def banner(w=1500, h=500):
    img = base(w, h); d = ImageDraw.Draw(img)
    spokes(d, w * 0.80, h * 0.5, h * 0.42, 13, seed=3, node=11, hub=24, line=(60, 96, 122))
    d.text((80, 96), "The Social", font=font("Playfair", 128), fill=COLD_100)
    d.text((80, 222), "Network", font=font("Playfair", 128), fill=COLD_100)
    d.text((84, 392), "FRIENDSHIP WAS THE INTERFACE. THE LIST WAS THE ASSET.", font=font("JetBrainsMono", 22, "Medium"), fill=COLD_350)
    return grain(img)

def og(w=1200, h=630):
    img = base(w, h); d = ImageDraw.Draw(img)
    m = mark(560); img.paste(m, (w - 600, 35), m); d = ImageDraw.Draw(img)
    d.text((72, 60), "●  THE SOCIAL NETWORK", font=font("JetBrainsMono", 22, "Medium"), fill=AMBER)
    f = font("Playfair", 92)
    for i, line in enumerate(["The network", "was always", "an asset."]): d.text((72, 150 + i * 104), line, font=f, fill=COLD_100)
    d.text((76, 520), "EVERY TRADE PAYS HOLDERS IN META STOCK · 70% ON-CHAIN", font=font("JetBrainsMono", 20, "Medium"), fill=COLD_350)
    return grain(img)

def payout_card(w=1080, h=1080):
    img = base(w, h); d = ImageDraw.Draw(img)
    d.text((80, 80), "THE SOCIAL NETWORK", font=font("JetBrainsMono", 26, "Medium"), fill=COLD_350)
    d.text((80, 126), "ROUND 001 · SETTLED ON-CHAIN", font=font("JetBrainsMono", 26, "Medium"), fill=AMBER)
    d.line((80, 190, w - 80, 190), fill=(60, 72, 92), width=2)
    d.text((80, 250), "Paid out", font=font("Playfair", 72), fill=COLD_100)
    d.text((80, 350), "0.00902807", font=font("JetBrainsMono", 150, "Medium"), fill=AMBER)
    d.text((84, 520), "META STOCK  ·  METAx", font=font("JetBrainsMono", 34, "Medium"), fill=COLD_350)
    for i, (k, v) in enumerate([("HOLDERS PAID", "2"), ("SHARE TO HOLDERS", "70%"), ("FEE PER TRADE", "2%")]):
        x = 80 + i * 320
        d.text((x, 640), k, font=font("JetBrainsMono", 22, "Medium"), fill=COLD_350)
        d.text((x, 680), v, font=font("Playfair", 64), fill=COLD_100)
    spokes(d, w * 0.5, h * 0.87, 70, 9, seed=5, node=8, hub=18, line=(60, 96, 122))
    d.text((80, h - 60), "the-social-network-steel.vercel.app  ·  every row is a transaction", font=font("JetBrainsMono", 20, "Medium"), fill=COLD_300)
    return grain(img)

def palette(w=1600, h=420):
    img = Image.new("RGB", (w, h), INK); d = ImageDraw.Draw(img)
    sw = [("Ink", INK, "#05070D"), ("Ink raise", INK_RAISE, "#111725"), ("Teal shadow", TEAL, "#17383F"), ("Cold 300", COLD_300, "#6E7D93"), ("Cold 100", COLD_100, "#C3CCD9"), ("Amber", AMBER, "#E8A33D"), ("Amber soft", AMBER_SOFT, "#F2C584"), ("2004 blue", FB, "#3B5998")]
    cw = w // len(sw)
    for i, (n, c, hx) in enumerate(sw):
        d.rectangle((i * cw, 0, (i + 1) * cw, 300), fill=c)
        d.text((i * cw + 20, 322), n.upper(), font=font("JetBrainsMono", 20, "Medium"), fill=COLD_350)
        d.text((i * cw + 20, 356), hx, font=font("JetBrainsMono", 24, "Medium"), fill=COLD_100)
    return img

if __name__ == "__main__":
    random.seed(1)
    mark().save(f"{OUT}/mark.png"); mark(transparent=False).convert("RGB").save(f"{OUT}/mark-dark.png")
    wordmark().save(f"{OUT}/wordmark.png")
    avatar().save(f"{OUT}/avatar.png", optimize=True)
    banner().save(f"{OUT}/x-banner.png", optimize=True)
    og().save(f"{OUT}/og.png", optimize=True)
    payout_card().save(f"{OUT}/payout-card.png", optimize=True)
    palette().save(f"{OUT}/palette.png", optimize=True)
    print("brand assets written")
