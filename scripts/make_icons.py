"""Sugeneruoja PNG ikonas (180, 192, 512) be jokių papildomų bibliotekų.

Paleidimas:  python scripts/make_icons.py
Piešinys: violetinis padarėlis su antenomis ant šviesaus fono.
"""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def circle(cx, cy, r):
    return lambda x, y: math.hypot(x - cx, y - cy) - r


def ellipse(cx, cy, rx, ry):
    def d(x, y):
        k = math.hypot((x - cx) / rx, (y - cy) / ry)
        return (k - 1) * min(rx, ry)
    return d


def segment(ax, ay, bx, by, w):
    def d(x, y):
        px, py, vx, vy = x - ax, y - ay, bx - ax, by - ay
        t = max(0.0, min(1.0, (px * vx + py * vy) / (vx * vx + vy * vy)))
        return math.hypot(px - vx * t, py - vy * t) - w / 2
    return d


def arc(cx, cy, r, a0, a1, w):
    """Lankas nuo kampo a0 iki a1 (radianais, pagal laikrodžio rodyklę ekrane)."""
    def d(x, y):
        a = math.atan2(y - cy, x - cx)
        if a0 <= a <= a1:
            return abs(math.hypot(x - cx, y - cy) - r) - w / 2
        e0 = (cx + r * math.cos(a0), cy + r * math.sin(a0))
        e1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
        return min(math.hypot(x - e0[0], y - e0[1]), math.hypot(x - e1[0], y - e1[1])) - w / 2
    return d


# Sluoksniai iš apačios į viršų: (atstumo funkcija, spalva).
LAYERS = [
    (segment(0.42, 0.30, 0.34, 0.16, 0.035), '#6d4fd6'),
    (segment(0.58, 0.30, 0.66, 0.16, 0.035), '#6d4fd6'),
    (circle(0.34, 0.15, 0.055), '#ffd23f'),
    (circle(0.66, 0.15, 0.055), '#ffd23f'),
    (ellipse(0.36, 0.86, 0.11, 0.06), '#6d4fd6'),
    (ellipse(0.64, 0.86, 0.11, 0.06), '#6d4fd6'),
    (circle(0.5, 0.57, 0.335), '#6d4fd6'),
    (circle(0.5, 0.57, 0.315), '#9b7bff'),
    (ellipse(0.5, 0.72, 0.19, 0.15), '#d9ccff'),
    (ellipse(0.33, 0.42, 0.09, 0.055), '#b9a5ff'),
    (circle(0.27, 0.62, 0.045), '#ff9fc0'),
    (circle(0.73, 0.62, 0.045), '#ff9fc0'),
    (circle(0.39, 0.52, 0.085), '#2b2340'),
    (circle(0.61, 0.52, 0.085), '#2b2340'),
    (circle(0.39, 0.52, 0.073), '#ffffff'),
    (circle(0.61, 0.52, 0.073), '#ffffff'),
    (circle(0.40, 0.535, 0.04), '#2b2340'),
    (circle(0.62, 0.535, 0.04), '#2b2340'),
    (circle(0.415, 0.51, 0.014), '#ffffff'),
    (circle(0.635, 0.51, 0.014), '#ffffff'),
    (arc(0.5, 0.60, 0.085, 0.35, math.pi - 0.35, 0.03), '#2b2340'),
]

BG_TOP = hex_rgb('#fff4d6')
BG_BOTTOM = hex_rgb('#ffd98a')


def render(size):
    rows = []
    px = 1.0 / size
    layers = [(f, hex_rgb(c)) for f, c in LAYERS]
    for j in range(size):
        y = (j + 0.5) / size
        t = j / (size - 1)
        bg = tuple(BG_TOP[k] + (BG_BOTTOM[k] - BG_TOP[k]) * t for k in range(3))
        row = bytearray([0])
        for i in range(size):
            x = (i + 0.5) / size
            r, g, b = bg
            for f, col in layers:
                d = f(x, y)
                if d > px:
                    continue
                a = max(0.0, min(1.0, 0.5 - d / px))
                r += (col[0] - r) * a
                g += (col[1] - g) * a
                b += (col[2] - b) * a
            row += bytes((int(r + .5), int(g + .5), int(b + .5)))
        rows.append(bytes(row))
    return b''.join(rows)


def png(size, raw):
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for s in (180, 192, 512):
        path = os.path.join(OUT, f'icon-{s}.png')
        with open(path, 'wb') as fh:
            fh.write(png(s, render(s)))
        print('Sukurta', os.path.normpath(path))
