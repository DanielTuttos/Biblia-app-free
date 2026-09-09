from PIL import Image, ImageDraw, ImageFont
import os, random

W, H = 1024, 500

BG_TOP = (26, 48, 88)
BG_BOTTOM = (15, 30, 60)
GOLD_LIGHT = (242, 218, 132)
GOLD_DARK = (168, 132, 58)
GOLD_MID = (212, 177, 96)
RED_RIBBON = (182, 46, 46)
WHITE = (255, 255, 255)
WHITE_SOFT = (242, 236, 220)
BOOK_DARK = (36, 56, 96)
BOOK_LIGHT = (54, 80, 128)


def draw_gradient(draw, w, h):
    for y in range(h):
        t = y / h
        r = int(BG_TOP[0] * (1 - t) + BG_BOTTOM[0] * t)
        g = int(BG_TOP[1] * (1 - t) + BG_BOTTOM[1] * t)
        b = int(BG_TOP[2] * (1 - t) + BG_BOTTOM[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def load_font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            return ImageFont.load_default()


def draw_book(draw, cx, cy, scale=1.0):
    bw = int(210 * scale)
    bh = int(170 * scale)
    spine_w = int(20 * scale)
    left_x = cx - bw // 2
    top_y = cy - bh // 2
    right_x = cx + bw // 2
    bot_y = cy + bh // 2

    draw.polygon([
        (left_x, top_y + int(12*scale)),
        (cx - spine_w//2, top_y),
        (cx - spine_w//2, bot_y),
        (left_x, bot_y - int(6*scale))
    ], fill=BOOK_DARK)

    draw.polygon([
        (cx + spine_w//2, top_y),
        (right_x, top_y + int(22*scale)),
        (right_x, bot_y - int(18*scale)),
        (cx + spine_w//2, bot_y)
    ], fill=BOOK_LIGHT)

    for i in range(3):
        y_offset = top_y + int(42*scale) + i * int(34*scale)
        lx1 = left_x + int(18*scale)
        lx2 = cx - spine_w//2 - int(8*scale)
        shade = GOLD_LIGHT if i == 0 else GOLD_MID if i == 1 else GOLD_DARK
        draw.line([(lx1, y_offset), (lx2, y_offset - int(4*scale))], fill=shade, width=int(6*scale))
        rx1 = cx + spine_w//2 + int(8*scale)
        rx2 = right_x - int(24*scale)
        draw.line([(rx1, y_offset), (rx2, y_offset + int(3*scale))], fill=shade, width=int(6*scale))

    spine_x1 = cx - spine_w//2
    spine_x2 = cx + spine_w//2
    for y in range(top_y, bot_y):
        t = (y - top_y) / bh
        r = int(GOLD_DARK[0] * (1-t) + GOLD_LIGHT[0] * t)
        g = int(GOLD_DARK[1] * (1-t) + GOLD_LIGHT[1] * t)
        b = int(GOLD_DARK[2] * (1-t) + GOLD_LIGHT[2] * t)
        draw.line([(spine_x1, y), (spine_x2, y)], fill=(r, g, b))


def draw_cross(draw, cx, cy, scale=1.0):
    size = int(74 * scale)
    thickness = int(19 * scale)
    top = cy - size // 2
    bot = cy + size // 2
    left_v = cx - thickness // 2
    right_v = cx + thickness // 2

    vgrad = []
    for y in range(size):
        t = y / size
        r = int(GOLD_DARK[0] * (1-t) + GOLD_LIGHT[0] * t)
        g = int(GOLD_DARK[1] * (1-t) + GOLD_LIGHT[1] * t)
        b = int(GOLD_DARK[2] * (1-t) + GOLD_LIGHT[2] * t)
        vgrad.append((r, g, b))

    for i, y in enumerate(range(top, bot)):
        draw.line([(left_v, y), (right_v, y)], fill=vgrad[i])

    crossbar_y = cy - size // 6
    crossbar_h = thickness
    crossbar_top = crossbar_y - crossbar_h // 2
    crossbar_bot = crossbar_y + crossbar_h // 2
    left_h = cx - size // 2
    right_h = cx + size // 2

    for y in range(crossbar_top, crossbar_bot):
        for g_i, x in enumerate(range(left_h, right_h)):
            t = g_i / max(1, (right_h - left_h - 1))
            r = int(GOLD_DARK[0] * (1-t) + GOLD_LIGHT[0] * t)
            g = int(GOLD_DARK[1] * (1-t) + GOLD_LIGHT[1] * t)
            b = int(GOLD_DARK[2] * (1-t) + GOLD_LIGHT[2] * t)
            draw.point((x, y), fill=(r, g, b))


def draw_ribbon_gratis(draw, cx, cy, scale=1.0):
    w = int(240 * scale)
    h = int(52 * scale)
    left = cx - w // 2
    right = cx + w // 2
    top = cy - h // 2
    bot = cy + h // 2
    depth = int(14 * scale)

    draw.polygon([
        (left, top + depth),
        (left - depth, top),
        (right + depth, top),
        (right, top + depth),
        (right, bot),
        (left, bot)
    ], fill=RED_RIBBON)

    shade = (130, 28, 28)
    draw.polygon([
        (left, top + depth),
        (left - depth, top),
        (left - depth, top + depth),
        (left, bot)
    ], fill=shade)
    draw.polygon([
        (right, top + depth),
        (right + depth, top),
        (right + depth, top + depth),
        (right, bot)
    ], fill=shade)

    font = load_font("/System/Library/Fonts/Avenir Next.ttc", int(34 * scale), index=6)
    text = "GRATIS"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2
    ty = cy - th // 2 - int(bbox[1])

    outline_c = (45, 12, 12)
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            draw.text((tx + dx, ty + dy), text, font=font, fill=outline_c)
    draw.text((tx, ty), text, font=font, fill=WHITE_SOFT)


def draw_soft_glow(img, cx, cy, radius, rgb, max_alpha=16):
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    step = max(1, radius // 28)
    for i in range(radius, 0, -step):
        alpha = int(max_alpha * (1 - i / radius))
        if alpha < 1:
            continue
        od.ellipse([cx-i, cy-i, cx+i, cy+i], fill=(rgb[0], rgb[1], rgb[2], alpha))
    return Image.alpha_composite(img, overlay)


def draw_starry_bg(draw, w, h):
    random.seed(42)
    for _ in range(50):
        x = random.randint(0, w)
        y = random.randint(0, h)
        s = random.choice([1, 1, 2])
        a = random.randint(18, 65)
        c = (235, 225, 185, a)
        if s == 1:
            draw.point((x, y), fill=c)
        else:
            draw.ellipse([x, y, x+s, y+s], fill=c)


def draw_gold_text_centered(draw, cx, cy, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2
    ty = cy - th // 2 - bbox[1]

    outline_c = (55, 35, 12)
    for dx in [-2, -1, 0, 1, 2]:
        for dy in [-2, -1, 0, 1, 2]:
            if dx == 0 and dy == 0:
                continue
            draw.text((tx + dx, ty + dy), text, font=font, fill=outline_c)

    temp_img = Image.new('RGBA', (tw + 12, th + 24), (0, 0, 0, 0))
    td = ImageDraw.Draw(temp_img)
    td.text((6, 12 - bbox[1]), text, font=font, fill=WHITE)

    grad_img = Image.new('RGBA', (tw + 12, th + 24), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad_img)
    for gy in range(th + 24):
        t = gy / max(1, (th + 23))
        r = int(GOLD_LIGHT[0] * (1-t) + GOLD_DARK[0] * t)
        g = int(GOLD_LIGHT[1] * (1-t) + GOLD_DARK[1] * t)
        b = int(GOLD_LIGHT[2] * (1-t) + GOLD_DARK[2] * t)
        gd.line([(0, gy), (tw + 12, gy)], fill=(r, g, b, 255))

    mask = temp_img.split()[3]
    grad_img.putalpha(mask)

    base = draw._image
    base.paste(grad_img, (tx - 6, ty - 12), mask=mask)


def draw_checkmark(draw, cx, cy, size, stroke_w=3):
    pts = [
        (cx - size * 0.42, cy + size * 0.02),
        (cx - size * 0.12, cy + size * 0.34),
        (cx + size * 0.44, cy - size * 0.30),
    ]
    draw.line([pts[0], pts[1]], fill=GOLD_LIGHT, width=stroke_w)
    draw.line([pts[1], pts[2]], fill=GOLD_LIGHT, width=stroke_w)


def draw_star(draw, cx, cy, size, fill=GOLD_LIGHT):
    import math
    pts = []
    for i in range(10):
        ang = math.radians(-90 + i * 36)
        r = size if i % 2 == 0 else size * 0.45
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    draw.polygon(pts, fill=fill)


def draw_feature_item(draw, x, y, text, size=24):
    font = load_font("/System/Library/Fonts/Avenir Next.ttc", size, index=3)
    cs = int(size * 0.90)

    draw.rounded_rectangle([x, y, x + cs, y + cs], radius=5,
                           fill=(42, 66, 112), outline=GOLD_MID, width=2)
    draw_checkmark(draw, x + cs//2, y + cs//2, cs * 0.78, stroke_w=max(2, size//8))

    gap = 14
    fb = draw.textbbox((0, 0), text, font=font)
    th_f = fb[3] - fb[1]
    text_x = x + cs + gap
    text_y = y + (cs - th_f) // 2 - fb[1]

    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            if dx == 0 and dy == 0:
                continue
            draw.text((text_x + dx, text_y + dy), text, font=font, fill=(6, 14, 32))
    draw.text((text_x, text_y), text, font=font, fill=WHITE_SOFT)

    return cs + gap + (fb[2] - fb[0])


base = Image.new('RGBA', (W, H), BG_TOP)
draw = ImageDraw.Draw(base, 'RGBA')

draw_gradient(draw, W, H)
draw_starry_bg(draw, W, H)

book_cx = int(W * 0.22)
book_cy = int(H * 0.46)
base = draw_soft_glow(base, book_cx, book_cy - 35, 120, GOLD_LIGHT, max_alpha=13)
draw = ImageDraw.Draw(base, 'RGBA')

draw_book(draw, book_cx, book_cy, scale=1.08)
draw_cross(draw, book_cx, book_cy - 155, scale=0.95)

text_cx = int(W * 0.645)

title_font = load_font("/System/Library/Fonts/Avenir Next.ttc", 124, index=6)
draw_gold_text_centered(draw, text_cx, 125, "BIBLIA", title_font)

tag_font = load_font("/System/Library/Fonts/Avenir Next.ttc", 30, index=2)
tag = "La Palabra de Dios siempre contigo"
tb = draw.textbbox((0, 0), tag, font=tag_font)
tw_tg = tb[2] - tb[0]
tx_tg = text_cx - tw_tg // 2
ty_tg = 210
for dx in [-1, 0, 1]:
    for dy in [-1, 0, 1]:
        if dx == 0 and dy == 0:
            continue
        draw.text((tx_tg + dx, ty_tg + dy), tag, font=tag_font, fill=(5, 12, 30))
draw.text((tx_tg, ty_tg), tag, font=tag_font, fill=WHITE_SOFT)

div_y = 270
for i in range(2):
    alpha_d = 150 - i * 55
    draw.line([(text_cx - 260, div_y + i * 2), (text_cx + 260, div_y + i * 2)],
              fill=(GOLD_MID[0], GOLD_MID[1], GOLD_MID[2], alpha_d), width=1)

features = ["Lectura offline", "M\u00faltiples traducciones", "Lectura diaria"]
feat_size = 23
gap_between = 40

total_w = 0
widths = []
for f in features:
    font = load_font("/System/Library/Fonts/Avenir Next.ttc", feat_size, index=3)
    cs = int(feat_size * 0.90)
    fb = draw.textbbox((0, 0), f, font=font)
    w_f = cs + 14 + (fb[2] - fb[0])
    widths.append(w_f)
    total_w += w_f
total_w += gap_between * (len(features) - 1)

feat_y = 302
cx_start = text_cx - total_w // 2
cur_x = cx_start
for i, f in enumerate(features):
    draw_feature_item(draw, cur_x, feat_y, f, size=feat_size)
    cur_x += widths[i] + gap_between

tag2_font = load_font("/System/Library/Fonts/Avenir Next.ttc", 19, index=2)
tag2 = "Reina Valera 1909 \u00b7 Espa\u00f1ol Sencillo \u00b7 Ingl\u00e9s \u00b7 Portugu\u00e9s y m\u00e1s"
tb2 = draw.textbbox((0, 0), tag2, font=tag2_font)
tw_t2 = tb2[2] - tb2[0]
tx_t2 = text_cx - tw_t2 // 2
ty_t2 = 400
for dx in [-1, 0, 1]:
    for dy in [-1, 0, 1]:
        if dx == 0 and dy == 0:
            continue
        draw.text((tx_t2 + dx, ty_t2 + dy), tag2, font=tag2_font, fill=(5, 12, 30))
tag2_c = (GOLD_MID[0] - 15, GOLD_MID[1] - 20, GOLD_MID[2] - 35)
draw.text((tx_t2, ty_t2), tag2, font=tag2_font, fill=tag2_c)

cta_font = load_font("/System/Library/Fonts/Avenir Next.ttc", 18, index=4)
cta_text1 = "Fácil de usar"
cta_text2 = "Sin anuncios intrusivos"
cb1 = draw.textbbox((0, 0), cta_text1, font=cta_font)
cb2 = draw.textbbox((0, 0), cta_text2, font=cta_font)
cw1 = cb1[2] - cb1[0]
cw2 = cb2[2] - cb2[0]
star_size = 9
gap1 = 14
gap2 = 22
total_cw = (star_size * 2 + gap1) + cw1 + (star_size * 2 + gap2) + cw2
cta_cx = text_cx
cta_start_x = cta_cx - total_cw // 2
cy_c = 448

def draw_cta_text(draw, x, y, text, font):
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, font=font, fill=(5, 12, 30))
    draw.text((x, y), text, font=font, fill=(GOLD_LIGHT[0] + 3, GOLD_LIGHT[1] - 5, GOLD_LIGHT[2] - 20))

cur_cx = cta_start_x
draw_star(draw, cur_cx + star_size, cy_c, star_size)
cur_cx += star_size * 2 + gap1
th_c = cb1[3] - cb1[1]
draw_cta_text(draw, cur_cx, cy_c - th_c // 2 - cb1[1], cta_text1, cta_font)
cur_cx += cw1 + gap2 // 2
draw_star(draw, cur_cx + star_size, cy_c, star_size)
cur_cx += star_size * 2 + gap2 // 2 + gap1
draw_cta_text(draw, cur_cx, cy_c - th_c // 2 - cb2[1], cta_text2, cta_font)
draw_star(draw, cur_cx + cw2 + gap1 + star_size, cy_c, star_size)

corner_overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(corner_overlay)
for i in range(5):
    a = int(30 - i * 5)
    if a <= 0:
        continue
    cd.rounded_rectangle([i+1, i+1, W-2-i, H-2-i], radius=22 - i*2,
                         outline=(GOLD_MID[0], GOLD_MID[1], GOLD_MID[2], a), width=1)
base = Image.alpha_composite(base, corner_overlay)

final = Image.new('RGB', (W, H), BG_TOP)
final.paste(base, mask=base.split()[3])

out_path = "/Users/danielromero/Desktop/Proyectos/ProyectosPersonales/React-native/biblia/assets/featured_graphic_1024x500.png"
final.save(out_path, format='PNG', optimize=True)

size_kb = os.path.getsize(out_path) / 1024
print(f"Guardado: {out_path}")
print(f"Dimensiones: {W}x{H} px")
print(f"Tamaño: {size_kb:.1f} KB (max 15 MB OK)")
