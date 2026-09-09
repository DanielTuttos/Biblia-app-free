from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

BASE = "/Users/danielromero/Desktop/Proyectos/ProyectosPersonales/React-native/biblia/assets/play_screenshots"
OUT_W, OUT_H = 1080, 1920
BG_BG_RGB = (250, 248, 245)  # #FAF8F5 for bright screens

PALETTES = [
    {
        "title": "Tu Biblia diaria",
        "subtitle": "Lectura del día y continua donde lo dejaste",
        "bg_top": (26, 48, 88),
        "bg_bottom": (54, 80, 128),
        "accent": (242, 218, 132),
        "title_color": (255, 255, 255),
        "subtitle_color": (240, 230, 205),
    },
    {
        "title": "66 libros organizados",
        "subtitle": "Antiguo y Nuevo Testamento · Navegación simple",
        "bg_top": (230, 205, 145),
        "bg_bottom": (184, 134, 11),
        "accent": (44, 36, 22),
        "title_color": (44, 36, 22),
        "subtitle_color": (80, 64, 40),
    },
    {
        "title": "Lectura inmersiva",
        "subtitle": "Versículos destacados · Tema oscuro · Capítulos enteros",
        "bg_top": (34, 30, 24),
        "bg_bottom": (78, 62, 36),
        "accent": (212, 168, 67),
        "title_color": (240, 235, 227),
        "subtitle_color": (210, 198, 175),
    },
    {
        "title": "Busca cualquier palabra",
        "subtitle": "Encuentra versículos al instante · Búsqueda offline",
        "bg_top": (226, 242, 232),
        "bg_bottom": (122, 178, 144),
        "accent": (35, 82, 54),
        "title_color": (22, 60, 38),
        "subtitle_color": (55, 95, 70),
    },
    {
        "title": "Personaliza tu experiencia",
        "subtitle": "Idioma · Traducción · Tamaño · Recordatorio diario",
        "bg_top": (242, 236, 220),
        "bg_bottom": (208, 188, 146),
        "accent": (184, 134, 11),
        "title_color": (60, 45, 18),
        "subtitle_color": (110, 90, 55),
    },
]

RAW_FILES = [
    "raw_1_home.png",
    "raw_2_bible.png",
    "raw_3_reading.png",
    "raw_4_search.png",
    "raw_5_settings.png",
]

def load_font(size, bold=False):
    idx = 6 if bold else 2
    try:
        return ImageFont.truetype("/System/Library/Fonts/Avenir Next.ttc", size, index=idx)
    except Exception:
        try:
            return ImageFont.truetype("/System/Library/Fonts/Avenir Next.ttc", size)
        except Exception:
            return ImageFont.load_default()

def load_serif(size, bold=True):
    try:
        return ImageFont.truetype("/System/Library/Fonts/Georgia.ttf", size)
    except Exception:
        return load_font(size, bold=bold)


def auto_crop_ui(img_path):
    """Detect non-background central region and crop tightly to the UI body."""
    im = Image.open(img_path).convert("RGB")
    w, h = im.size
    px = im.load()

    # Pick expected background color from the corners (average)
    corners = [px[2,2], px[w-3,2], px[2,h-3], px[w-3,h-3]]
    bg_r = sum(c[0] for c in corners)//4
    bg_g = sum(c[1] for c in corners)//4
    bg_b = sum(c[2] for c in corners)//4

    tol = 10
    def is_bg(x,y):
        r,g,b = px[x,y]
        return abs(r-bg_r)<=tol and abs(g-bg_g)<=tol and abs(b-bg_b)<=tol

    # Scan rows
    top, bottom = 0, h-1
    for y in range(h):
        if not all(is_bg(x,y) for x in range(0, w, 10)):
            top = max(0, y-4); break
    for y in range(h-1, -1, -1):
        if not all(is_bg(x,y) for x in range(0, w, 10)):
            bottom = min(h-1, y+4); break

    left, right = 0, w-1
    for x in range(w):
        if not all(is_bg(x,y) for y in range(top, bottom+1, 10)):
            left = max(0, x-4); break
    for x in range(w-1, -1, -1):
        if not all(is_bg(x,y) for y in range(top, bottom+1, 10)):
            right = min(w-1, x+4); break

    return im.crop((left, top, right+1, bottom+1))


def draw_gradient_bg(draw, w, h, top_c, bot_c):
    for y in range(h):
        t = y / max(1, h-1)
        r = int(top_c[0]*(1-t) + bot_c[0]*t)
        g = int(top_c[1]*(1-t) + bot_c[1]*t)
        b = int(top_c[2]*(1-t) + bot_c[2]*t)
        draw.line([(0,y),(w,y)], fill=(r,g,b))


def draw_soft_circles(img, color, alpha=22):
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    W, H = img.size
    circles = [
        (int(W*0.18), int(H*0.12), 320),
        (int(W*0.92), int(H*0.28), 220),
        (int(W*0.08), int(H*0.92), 280),
        (int(W*0.78), int(H*0.86), 200),
    ]
    for cx, cy, r in circles:
        for i in range(r, 0, -8):
            a = int(alpha * (1 - i/r))
            if a < 1: continue
            od.ellipse([cx-i, cy-i, cx+i, cy+i], fill=(color[0],color[1],color[2],a))
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def fit_screen_to_ratio(screen_img, target_w, screen_bg, ratio_h=16, ratio_w=9):
    """Paste the actual screen content inside a properly ratioed (9:16) phone panel.
    Fit image preserving aspect, fill borders with matching background color."""
    target_h = int(target_w * ratio_h / ratio_w)
    canvas = Image.new("RGB", (target_w, target_h), screen_bg)
    src_w, src_h = screen_img.size
    # scale to fit target width exactly first
    new_w = target_w
    new_h = int(src_h * (target_w / src_w))
    if new_h > target_h:
        # don't overflow height; scale by height instead
        new_h = target_h
        new_w = int(src_w * (target_h / src_h))
    resized = screen_img.resize((new_w, new_h), Image.LANCZOS)
    x = (target_w - new_w) // 2
    y = (target_h - new_h) // 2
    canvas.paste(resized, (x, y))
    return canvas

def detect_screen_bg(img):
    """Get corner-averaged background color so we can fill letterbox with it."""
    w, h = img.size
    px = img.load()
    corners = [px[4,4], px[w-5,4], px[4,h-5], px[w-5,h-5]]
    r = sum(c[0] for c in corners)//4
    g = sum(c[1] for c in corners)//4
    b = sum(c[2] for c in corners)//4
    return (r, g, b)


def draw_phone_frame(canvas_draw, canvas_img, screen_img, cx, cy, screen_w):
    """Draw a rounded-corner phone mockup with screen and subtle bezel + shadow.
    screen_img here is 9:16 already."""
    aspect_w, aspect_h = screen_img.size
    target_h = int(screen_w * (aspect_h / aspect_w))

    # Shadow under phone using multiple blurred layers
    shadow_w = screen_w + 80
    shadow_h = target_h + 80
    shadow = Image.new("RGBA", (shadow_w, shadow_h), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([30, 30, shadow_w-30, shadow_h-30], radius=56, fill=(0,0,0,120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    sx = cx - shadow_w//2
    sy = cy - shadow_h//2
    if canvas_img.mode != "RGBA":
        canvas_img = canvas_img.convert("RGBA")
    canvas_img.alpha_composite(shadow, (sx, sy))

    # Resize screen (it's already 9:16 but we resize to the exact phone dimensions)
    screen_img_r = screen_img.resize((screen_w, target_h), Image.LANCZOS)

    # Bezel (phone frame)
    bezel = 18
    phone_w = screen_w + 2*bezel
    phone_h = target_h + 2*bezel
    px = cx - phone_w//2
    py = cy - phone_h//2

    # Phone background (blackish)
    phone_layer = Image.new("RGBA", (phone_w, phone_h), (0,0,0,0))
    pd = ImageDraw.Draw(phone_layer)
    pd.rounded_rectangle([0, 0, phone_w, phone_h], radius=60, fill=(22,20,16,255), outline=(60,54,44,255), width=2)

    # Screen inset
    screen_paste_x = bezel
    screen_paste_y = bezel
    screen_mask = Image.new("L", (screen_w, target_h), 0)
    md = ImageDraw.Draw(screen_mask)
    md.rounded_rectangle([0,0,screen_w,target_h], radius=42, fill=255)
    screen_img_rgba = screen_img_r.convert("RGBA")
    phone_layer.paste(screen_img_rgba, (screen_paste_x, screen_paste_y), mask=screen_mask)

    # Speaker/cutout small dot
    pd.ellipse([phone_w//2 - 26, 6, phone_w//2 + 26, 20], fill=(12,10,8,255))

    canvas_img.alpha_composite(phone_layer, (px, py))
    return canvas_img, phone_h


def draw_text_with_shadow(draw, xy, text, font, color, shadow_color=(0,0,0), offset=2, shadow_alpha=120):
    x, y = xy
    sh_r = (shadow_color[0], shadow_color[1], shadow_color[2], shadow_alpha)
    # Draw outline multi
    for dx in [-offset, 0, offset]:
        for dy in [-offset, 0, offset]:
            if dx==0 and dy==0: continue
            draw.text((x+dx, y+dy), text, font=font, fill=(sh_r[0], sh_r[1], sh_r[2]) if draw._image.mode=="RGB" else sh_r)
    draw.text(xy, text, font=font, fill=color)


out_paths = []
for idx in range(5):
    raw = os.path.join(BASE, RAW_FILES[idx])
    pal = PALETTES[idx]

    # Step 1: crop the screenshot tightly
    cropped = auto_crop_ui(raw)

    # Step 2: build canvas 1080x1920
    canvas = Image.new("RGB", (OUT_W, OUT_H), pal["bg_top"])
    draw = ImageDraw.Draw(canvas)
    draw_gradient_bg(draw, OUT_W, OUT_H, pal["bg_top"], pal["bg_bottom"])

    # Decorative soft circles
    canvas = draw_soft_circles(canvas, pal["accent"], alpha=18)
    draw = ImageDraw.Draw(canvas)

    # Decorative divider at top
    accent = pal["accent"]
    line_y = int(OUT_H * 0.285)
    for i in range(3):
        alpha = 1.0 - i * 0.27
        alpha_color = tuple(
            max(0, min(255, int(accent[j] * alpha + pal["bg_bottom"][j] * (1-alpha))))
            for j in range(3)
        )
        draw.line([(OUT_W//2 - 70, line_y + i*3), (OUT_W//2 + 70, line_y + i*3)], fill=alpha_color, width=1)

    # Big title
    title_font = load_serif(86, bold=True)
    title = pal["title"]
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (OUT_W - tw) // 2
    ty = int(OUT_H * 0.13) - th//2 - bbox[1]

    # Dark title shadow if bg is light
    sc = (0,0,0) if sum(pal["subtitle_color"])/3 < 160 else (20,15,5)
    draw_text_with_shadow(draw, (tx, ty), title, title_font, pal["title_color"],
                          shadow_color=sc, offset=3, shadow_alpha=140)

    # Subtitle
    sub_font = load_font(30, bold=False)
    sub = pal["subtitle"]
    bbox2 = draw.textbbox((0,0), sub, font=sub_font)
    sw = bbox2[2] - bbox2[0]
    sx = (OUT_W - sw)//2
    sy = int(OUT_H * 0.22) - (bbox2[3]-bbox2[1])//2 - bbox2[1]
    draw_text_with_shadow(draw, (sx, sy), sub, sub_font, pal["subtitle_color"],
                          shadow_color=sc, offset=2, shadow_alpha=100)

    # Phone frame with screen in lower section
    canvas_rgba = canvas.convert("RGBA")
    phone_cx = OUT_W // 2
    phone_cy = int(OUT_H * 0.59)
    screen_display_w = 700  # size of screen INSIDE the phone (will be 9:16 tall)
    # Step: prepare the cropped UI inside a properly 9:16 phone screen panel
    screen_bg = detect_screen_bg(cropped)
    proper_ratio_screen = fit_screen_to_ratio(cropped, screen_display_w, screen_bg, 16, 9)
    canvas_rgba, phone_h = draw_phone_frame(draw, canvas_rgba, proper_ratio_screen, phone_cx, phone_cy, screen_display_w)

    canvas = canvas_rgba.convert("RGB")

    # Bottom small badge - below the phone, centered at bottom area of canvas
    badge_y = int(OUT_H * 0.96)
    badge_text = "Santa Biblia · 66 libros"
    badge_font = load_font(22, bold=True)
    bb = draw.textbbox((0,0), badge_text, font=badge_font)
    bw = bb[2] - bb[0]
    bh = bb[3] - bb[1]
    bx = (OUT_W - bw)//2
    by = badge_y - bh//2 - bb[1]
    pad_x = 26
    pad_y = 12
    r = 28
    overlay = Image.new("RGBA", (OUT_W, OUT_H), (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    od.rounded_rectangle([bx-pad_x, by-pad_y, bx+bw+pad_x, by+bh+pad_y], radius=r,
                         fill=(255,255,255,38), outline=(accent[0], accent[1], accent[2], 200), width=2)
    canvas_rgba = canvas.convert("RGBA")
    canvas_rgba.alpha_composite(overlay)
    d2 = ImageDraw.Draw(canvas_rgba)
    d2.text((bx, by), badge_text, font=badge_font, fill=(accent[0], accent[1], accent[2]))
    canvas = canvas_rgba.convert("RGB")

    out_path = os.path.join(BASE, f"phone_screenshot_{idx+1}.png")
    canvas.save(out_path, format="PNG", optimize=True)
    size_kb = os.path.getsize(out_path)/1024
    print(f"[{idx+1}] {os.path.basename(out_path)}  {OUT_W}x{OUT_H}  {size_kb:.1f} KB")
    out_paths.append(out_path)

print("\n✅ 5 capturas listas para Play Store")
print(f"Ruta: {BASE}/")
for p in out_paths:
    print("  ·", os.path.basename(p))
