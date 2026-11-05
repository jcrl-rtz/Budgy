#!/usr/bin/env python3
"""Regenerates Budgy's PWA icons (white badge, brown "b", caramel coin).
Same geometry as BrandMark in ui.js (64-unit grid).   Usage:  python3 make-icons.py   (needs Pillow)
Writes icons/icon-192.png, icons/icon-512.png, icons/apple-touch-icon.png (180, full-bleed) and icons/maskable-512.png (full-bleed, safe zone)."""
from PIL import Image, ImageDraw, ImageFilter
import os

SS = 4  # supersampling for smooth edges


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vgrad(w, h, stops):
    """Vertical gradient image; stops = [(pos 0..1, (r,g,b)), ...]"""
    img = Image.new("RGB", (1, h))
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        for i in range(len(stops) - 1):
            (p0, c0), (p1, c1) = stops[i], stops[i + 1]
            if p0 <= t <= p1:
                px[0, y] = lerp(c0, c1, (t - p0) / max(p1 - p0, 1e-9))
                break
    return img.resize((w, h))


def render(size, rounded=True, glyph_scale=1.0):
    S = size * SS
    u = S / 64.0  # one grid unit in pixels

    # --- paper (white) background ---
    bg = vgrad(S, S, [(0, (255, 255, 255)), (1, (241, 232, 222))]).convert("RGBA")
    if rounded:
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=14.4 * u, fill=255)
        out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        out.paste(bg, (0, 0), m)
        mask_bg = m
    else:
        out = bg
        mask_bg = None

    d = ImageDraw.Draw(out)
    # thin brown inner hairline (premium edge)
    inset = 3.2 * u
    d.rounded_rectangle([inset, inset, S - inset, S - inset], radius=11.6 * u, outline=(123, 77, 48, 56), width=max(1, round(0.9 * u)))

    # --- glyph "b" (stem + bowl) in a brown gradient ---
    cx, cy = 32 * u, 32 * u

    def T(x, y):  # grid -> pixel, shifting the glyph to centre it, then scaling around the centre
        gx, gy = (x - 1.9) * u, (y + 1.0) * u
        return (cx + (gx - cx) * glyph_scale, cy + (gy - cy) * glyph_scale)

    gm = Image.new("L", (S, S), 0)
    gd = ImageDraw.Draw(gm)
    x0, y0 = T(21.1, 12.4)
    x1, y1 = T(27.5, 49.5)
    gd.rounded_rectangle([x0, y0, x1, y1], radius=3.2 * u * glyph_scale, fill=255)
    ccx, ccy = T(33.9, 36.7)
    ro, ri = 12.8 * u * glyph_scale, 6.4 * u * glyph_scale
    gd.ellipse([ccx - ro, ccy - ro, ccx + ro, ccy + ro], fill=255)
    gd.ellipse([ccx - ri, ccy - ri, ccx + ri, ccy + ri], fill=0)

    # soft brown shadow under the glyph
    sh = Image.new("L", (S, S), 0)
    sh.paste(gm, (0, round(1.2 * u)))
    sh = sh.filter(ImageFilter.GaussianBlur(1.1 * u)).point(lambda v: int(v * 0.28))
    shadow = Image.new("RGBA", (S, S), (59, 31, 16, 0))
    shadow.putalpha(sh)
    out = Image.alpha_composite(out, shadow)

    top, bot = T(0, 12.4)[1], T(0, 49.5)[1]
    gl = vgrad(S, S, [(0, (160, 106, 67)), (0.55, (110, 68, 41)), (1, (67, 38, 26))])
    # stretch the gradient so it spans the glyph's vertical extent
    band = vgrad(S, max(1, round(bot - top)), [(0, (160, 106, 67)), (0.55, (110, 68, 41)), (1, (67, 38, 26))])
    gl = Image.new("RGB", (S, S), (67, 38, 26))
    gl.paste(Image.new("RGB", (S, S), (160, 106, 67)).crop((0, 0, S, max(0, round(top)))), (0, 0))
    gl.paste(band, (0, round(top)))
    out.paste(gl, (0, 0), gm)

    # --- caramel coin accent ---
    kx, ky = T(47.6, 16.6)
    kr = 3.3 * u * glyph_scale
    cm = Image.new("L", (S, S), 0)
    ImageDraw.Draw(cm).ellipse([kx - kr, ky - kr, kx + kr, ky + kr], fill=255)
    coin = vgrad(S, S, [(0, (227, 176, 124)), (1, (181, 122, 72))])
    out.paste(coin, (0, 0), cm)

    if mask_bg is not None:  # keep corners transparent after all compositing
        a = out.getchannel("A")
        out.putalpha(Image.composite(a, Image.new("L", (S, S), 0), mask_bg))
    return out.resize((size, size), Image.LANCZOS)


def save(img, path, flatten=False):
    if flatten:
        base = Image.new("RGB", img.size, (255, 255, 255))
        base.paste(img, (0, 0), img.getchannel("A"))
        img = base
    img.save(path, optimize=True)
    print("wrote", path, img.size)


if __name__ == "__main__":
    os.makedirs("icons", exist_ok=True)
    save(render(192, rounded=True), "icons/icon-192.png")
    save(render(512, rounded=True), "icons/icon-512.png")
    save(render(180, rounded=False), "icons/apple-touch-icon.png", flatten=True)   # iOS rounds the corners itself
    save(render(512, rounded=False, glyph_scale=0.8), "icons/maskable-512.png", flatten=True)  # glyph inside the 80% safe zone
