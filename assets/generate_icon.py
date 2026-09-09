from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os
import math

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "images")

BG_TOP = (26, 48, 88)
BG_BOTTOM = (15, 30, 60)
GOLD_LIGHT = (242, 218, 132)
GOLD_DARK = (168, 132, 58)
GOLD_MID = (212, 177, 96)
BOOK_DARK = (36, 56, 96)
BOOK_LIGHT = (54, 80, 128)
BOOK_PAGE_SHADOW = (22, 36, 68)

MONO_BG_TOP = (38, 38, 38)
MONO_BG_BOTTOM = (22, 22, 22)
MONO_LIGHT = (220, 220, 220)
MONO_DARK = (120, 120, 120)
MONO_MID = (170, 170, 170)
MONO_BOOK_DARK = (55, 55, 55)
MONO_BOOK_LIGHT = (75, 75, 75)
MONO_PAGE_SHADOW = (30, 30, 30)


def draw_linear_gradient(img, top_c, bot_c):
    w, h = img.size
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top_c[0] * (1 - t) + bot_c[0] * t)
        g = int(top_c[1] * (1 - t) + bot_c[1] * t)
        b = int(top_c[2] * (1 - t) + bot_c[2] * t)
        a = top_c[3] if len(top_c) == 4 else 255
        draw.line([(0, y), (w, y)], fill=(r, g, b, a))


def squircle_mask(size, radius_ratio=0.23):
    w = h = size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    r = int(size * radius_ratio)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    return mask


def rounded_square(img_size, radius_ratio=0.23):
    return squircle_mask(img_size, radius_ratio)


def draw_radial_vignette(base, rgb=(0, 0, 0), max_alpha=85):
    w, h = base.size
    cx, cy = w // 2, h // 2
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    max_r = int(math.hypot(w, h) * 0.55)
    min_r = int(max_r * 0.45)
    step = max(1, (max_r - min_r) // 40)
    for r_val in range(max_r, min_r, -step):
        t = (r_val - min_r) / max(1, (max_r - min_r))
        alpha = int(max_alpha * (1 - t * t))
        if alpha <= 0:
            continue
        od.ellipse(
            [cx - r_val, cy - r_val, cx + r_val, cy + r_val],
            outline=(rgb[0], rgb[1], rgb[2], alpha),
            width=step + 2,
        )
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))


def draw_book_3d(draw, img, cx, cy, scale, palette):
    book_dark, book_light, page_shadow, gold_light, gold_dark, gold_mid = palette

    bw = int(320 * scale)
    bh = int(240 * scale)
    spine_w = int(28 * scale)
    depth = int(30 * scale)
    left_x = cx - bw // 2
    top_y = cy - bh // 2
    right_x = cx + bw // 2
    bot_y = cy + bh // 2

    bg_rgb = (0, 0, 0)
    overlay = Image.new("RGBA", img.size, bg_rgb + (0,))
    od = ImageDraw.Draw(overlay)

    # ---- Back cover (shadow behind) ----
    back_off = int(depth * 0.6)
    od.polygon(
        [
            (left_x - back_off, top_y + int(14 * scale)),
            (cx - spine_w // 2 - back_off, top_y + back_off),
            (cx - spine_w // 2 - back_off, bot_y - back_off),
            (left_x - back_off, bot_y - int(6 * scale)),
        ],
        fill=page_shadow,
    )

    # ---- Left page (cover visible) ----
    od.polygon(
        [
            (left_x, top_y + int(14 * scale)),
            (cx - spine_w // 2, top_y),
            (cx - spine_w // 2, bot_y),
            (left_x, bot_y - int(6 * scale)),
        ],
        fill=book_dark,
    )
    # Left page bevel highlight
    for i in range(int(10 * scale)):
        t = i / max(1, int(10 * scale) - 1)
        col = lerp_color(book_light, book_dark, t)
        ox = left_x + i
        off1 = int(14 * scale * (1 - t))
        off2 = int(6 * scale * (1 - t))
        od.line(
            [
                (ox, top_y + off1),
                (ox, bot_y - off2),
            ],
            fill=col + (255,),
            width=1,
        )

    # ---- Right page (cover visible, more angled shadow) ----
    od.polygon(
        [
            (cx + spine_w // 2, top_y),
            (right_x, top_y + int(26 * scale)),
            (right_x, bot_y - int(20 * scale)),
            (cx + spine_w // 2, bot_y),
        ],
        fill=book_light,
    )
    # Right page bottom shadow
    od.polygon(
        [
            (cx + spine_w // 2, bot_y),
            (right_x, bot_y - int(20 * scale)),
            (right_x - int(10 * scale), bot_y - int(10 * scale)),
            (cx + spine_w // 2, bot_y - int(2 * scale)),
        ],
        fill=page_shadow,
    )

    # ---- Spine (gold vertical gradient) ----
    spine_x1 = cx - spine_w // 2
    spine_x2 = cx + spine_w // 2
    for y in range(top_y, bot_y):
        t = (y - top_y) / max(1, (bot_y - top_y - 1))
        col = lerp_color(gold_dark, gold_light, t)
        od.line([(spine_x1, y), (spine_x2, y)], fill=col + (255,))

    # ---- Text lines (gold accents) on pages ----
    for i in range(3):
        y_offset = top_y + int(58 * scale) + i * int(44 * scale)
        shade = (
            gold_light if i == 0 else gold_mid if i == 1 else gold_dark
        )
        lx1 = left_x + int(26 * scale)
        lx2 = cx - spine_w // 2 - int(14 * scale)
        od.line(
            [(lx1, y_offset), (lx2, y_offset - int(5 * scale))],
            fill=shade + (255,),
            width=max(1, int(7 * scale)),
        )
        rx1 = cx + spine_w // 2 + int(14 * scale)
        rx2 = right_x - int(36 * scale)
        od.line(
            [(rx1, y_offset + int(2 * scale)), (rx2, y_offset + int(6 * scale))],
            fill=shade + (255,),
            width=max(1, int(7 * scale)),
        )

    # ---- Page edges (shading on open edges) ----
    # Left open edge highlight
    lx = left_x
    for i in range(max(1, int(3 * scale))):
        t = i / max(1, int(3 * scale) - 1)
        col = lerp_color((20, 30, 55), book_dark, t)
        od.line(
            [(lx - i, top_y + int(14 * scale) + i), (lx - i, bot_y - int(6 * scale))],
            fill=col + (255,),
        )

    base_rgba = img.convert("RGBA")
    base_rgba.alpha_composite(overlay)
    return base_rgba


def draw_cross_3d(base, cx, cy, scale, palette):
    _, _, _, gold_light, gold_dark, _ = palette
    size = int(100 * scale)
    thickness = int(26 * scale)
    top = cy - size // 2
    bot = cy + size // 2
    left_v = cx - thickness // 2
    right_v = cx + thickness // 2

    w, h = base.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    # Vertical bar
    for i, y in enumerate(range(top, bot)):
        t = i / max(1, (bot - top - 1))
        col = lerp_color(gold_dark, gold_light, t)
        od.line([(left_v, y), (right_v, y)], fill=col + (255,))

    crossbar_y = cy - size // 5
    crossbar_h = thickness
    crossbar_top = crossbar_y - crossbar_h // 2
    crossbar_bot = crossbar_y + crossbar_h // 2
    left_h = cx - size // 2
    right_h = cx + size // 2

    for y in range(crossbar_top, crossbar_bot):
        for g_i, x in enumerate(range(left_h, right_h)):
            t = g_i / max(1, (right_h - left_h - 1))
            col = lerp_color(gold_dark, gold_light, t)
            od.point((x, y), fill=col + (255,))

    # Soft highlight on top edge
    hl_c = lerp_color(gold_light, (255, 245, 220), 0.5)
    od.line([(left_v + 2, top), (right_v - 2, top)], fill=hl_c + (255,), width=1)
    od.line(
        [(left_h, crossbar_top), (right_h, crossbar_top)], fill=hl_c + (255,), width=1
    )

    return Image.alpha_composite(base.convert("RGBA"), overlay)


def build_icon_artwork(size, palette, has_bg=True, squircle=True, mono=False):
    book_dark, book_light, page_shadow, gold_light, gold_dark, gold_mid = palette

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_c = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    if has_bg:
        if mono:
            draw_linear_gradient(bg_c, MONO_BG_TOP + (255,), MONO_BG_BOTTOM + (255,))
        else:
            draw_linear_gradient(bg_c, BG_TOP + (255,), BG_BOTTOM + (255,))
        bg_c = draw_radial_vignette(bg_c, rgb=(0, 0, 0), max_alpha=70)

    canvas_rgba = canvas if not has_bg else bg_c
    cx = size // 2
    cy = size // 2 + int(size * 0.06)
    scale = size / 1024

    canvas_rgba = draw_book_3d(
        ImageDraw.Draw(canvas_rgba),
        canvas_rgba,
        cx,
        cy,
        scale,
        palette,
    )
    canvas_rgba = draw_cross_3d(
        canvas_rgba, cx, cy - int(size * 0.22), scale, palette
    )

    if squircle and has_bg:
        mask = squircle_mask(size, radius_ratio=0.22)
        result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        result.paste(canvas_rgba, (0, 0), mask)
        return result
    return canvas_rgba


COLOR_PALETTE = (
    BOOK_DARK,
    BOOK_LIGHT,
    BOOK_PAGE_SHADOW,
    GOLD_LIGHT,
    GOLD_DARK,
    GOLD_MID,
)

MONO_PALETTE = (
    MONO_BOOK_DARK,
    MONO_BOOK_LIGHT,
    MONO_PAGE_SHADOW,
    MONO_LIGHT,
    MONO_DARK,
    MONO_MID,
)

FOREGROUND_PALETTE = (
    BOOK_DARK,
    BOOK_LIGHT,
    BOOK_PAGE_SHADOW,
    GOLD_LIGHT,
    GOLD_DARK,
    GOLD_MID,
)


def save_png(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, format="PNG", optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f"  · {os.path.basename(path):40s} {img.size[0]}x{img.size[1]}  {kb:.1f} KB")


def main():
    print("🔧 Generando iconos (sin listón 'GRATIS')...\n")

    # --- 1) Iconos con fondo squircle (App Icons / Play Store Icons) ---
    # 1024x1024 (icon.png, icono_biblia_1024, splash-icon)
    icon_1024 = build_icon_artwork(1024, COLOR_PALETTE, has_bg=True, squircle=True)
    save_png(icon_1024, os.path.join(IMAGES_DIR, "icon.png"))
    save_png(icon_1024, os.path.join(BASE_DIR, "icono_biblia_1024.png"))
    save_png(icon_1024, os.path.join(IMAGES_DIR, "splash-icon.png"))

    # 512x512
    icon_512 = icon_1024.resize((512, 512), Image.LANCZOS)
    save_png(icon_512, os.path.join(BASE_DIR, "icono_biblia_512.png"))

    # Favicon 48x48
    icon_48 = icon_1024.resize((48, 48), Image.LANCZOS)
    save_png(icon_48, os.path.join(IMAGES_DIR, "favicon.png"))

    # --- 2) Adaptive Icon Foreground (solo dibujo, fondo TRANSPARENTE, SIN squircle) ---
    fg_1024 = build_icon_artwork(1024, FOREGROUND_PALETTE, has_bg=False, squircle=False)
    save_png(fg_1024, os.path.join(IMAGES_DIR, "android-icon-foreground.png"))

    # --- 3) Monochrome (escala de grises, con fondo squircle) ---
    mono_1024 = build_icon_artwork(1024, MONO_PALETTE, has_bg=True, squircle=True, mono=True)
    save_png(mono_1024, os.path.join(IMAGES_DIR, "android-icon-monochrome.png"))

    print("\n✅ Todos los iconos regenerados correctamente (sin 'GRATIS').")


if __name__ == "__main__":
    main()
