"""Free image maker (no AI, no API key): branded template with headline, badge, button and contact line."""
import io, os, re, uuid
from PIL import Image, ImageDraw, ImageFont
import db, assets

SIZE = {"Instagram": (1080, 1350), "Facebook": (1200, 900), "X": (1200, 675), "LinkedIn": (1200, 900)}
FONTS = ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf",
         "/System/Library/Fonts/Helvetica.ttc", "C:/Windows/Fonts/arialbd.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
FONT_SETS = {
    "Modern": FONTS,
    "Elegant": ["/System/Library/Fonts/Supplemental/Georgia Bold.ttf", "C:/Windows/Fonts/georgiab.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"],
    "Friendly": ["/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf", "C:/Windows/Fonts/trebucbd.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
}
SIZE_SCALE = {"Small": 0.8, "Medium": 1.0, "Large": 1.2}

def _t(bg, head, accent, soft, bar, btn, btn_text):
    return dict(bg=bg, head=head, accent=accent, soft=soft, bar=bar, btn=btn, btn_text=btn_text)

THEMES = {
    "Cream":    _t((255, 243, 227), (74, 44, 26),   (232, 104, 58), (122, 82, 56),   (232, 176, 74), (74, 44, 26),   (255, 243, 227)),
    "Peach":    _t((255, 225, 208), (88, 38, 28),   (214, 69, 65),  (140, 82, 66),   (244, 162, 97), (88, 38, 28),   (255, 225, 208)),
    "Mint":     _t((225, 245, 236), (23, 64, 52),   (0, 128, 96),   (62, 110, 96),   (255, 190, 70), (23, 64, 52),   (225, 245, 236)),
    "Sky":      _t((222, 238, 252), (20, 45, 88),   (30, 110, 220), (70, 100, 140),  (255, 184, 0),  (20, 45, 88),   (222, 238, 252)),
    "Lavender": _t((236, 230, 250), (52, 32, 96),   (142, 68, 204), (104, 84, 150),  (255, 176, 106), (52, 32, 96),  (236, 230, 250)),
    "Rose":     _t((253, 228, 236), (96, 22, 52),   (214, 40, 96),  (150, 70, 100),  (255, 170, 120), (96, 22, 52),  (253, 228, 236)),
    "Sunshine": _t((255, 238, 170), (62, 40, 0),    (214, 70, 20),  (120, 90, 20),   (62, 40, 0),    (62, 40, 0),    (255, 238, 170)),
    "Sand":     _t((238, 226, 206), (56, 44, 30),   (176, 92, 50),  (112, 96, 76),   (200, 150, 80), (56, 44, 30),   (238, 226, 206)),
    "Midnight": _t((18, 24, 48),    (245, 240, 225), (255, 196, 70), (178, 184, 210), (255, 196, 70), (255, 196, 70), (18, 24, 48)),
    "Forest":   _t((20, 52, 40),    (240, 244, 230), (170, 224, 110), (180, 208, 190), (170, 224, 110), (170, 224, 110), (20, 52, 40)),
    "Charcoal": _t((34, 34, 38),    (250, 250, 250), (255, 120, 80), (190, 190, 198), (255, 120, 80), (255, 120, 80), (34, 34, 38)),
    "Berry":    _t((92, 24, 72),    (255, 236, 246), (255, 184, 108), (230, 190, 216), (255, 184, 108), (255, 184, 108), (92, 24, 72)),
}

def _font(n, style="Modern"):
    for p in FONT_SETS.get(style, FONTS) + FONTS:
        try: return ImageFont.truetype(p, n)
        except Exception: pass
    try: return ImageFont.load_default(size=n)
    except TypeError: return ImageFont.load_default()

def _lum(c): return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]

def _split_long(draw, w, font, width):
    out, cur = [], ""
    for ch in w:
        if draw.textlength(cur + ch, font=font) <= width: cur += ch
        else:
            if cur: out.append(cur)
            cur = ch
    if cur: out.append(cur)
    return out or [w]

def _wrap(draw, text, font, width):
    lines, cur = [], ""
    for w in text.split():
        if draw.textlength(w, font=font) > width:
            if cur: lines.append(cur); cur = ""
            parts = _split_long(draw, w, font, width)
            lines.extend(parts[:-1]); cur = parts[-1]
            continue
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= width: cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def _clean(t):
    t = re.sub(r"#\w+", "", t or "")
    t = "".join(c for c in t if ord(c) < 0x2000 or 0x2010 <= ord(c) <= 0x2027)
    t = re.sub(r"\s*[\u2014\u2013]\s*", " \u2014 ", t)
    return " ".join(t.split())

def _cut(s, n):
    s = s.strip()
    if len(s) <= n: return s
    return s[:n].rsplit(" ", 1)[0].rstrip(",;:-\u2014 ") + "..."

def compose(d):
    prof = db.get_profile()
    style = d.get("font") if d.get("font") in FONT_SETS else "Modern"
    T = THEMES.get(d.get("theme"), THEMES["Cream"])
    scale = SIZE_SCALE.get(d.get("size"), 1.0)
    show_logo = d.get("logo", True) not in (False, "false", 0)
    F = lambda n: _font(n, style)
    on_acc = (255, 255, 255) if _lum(T["accent"]) < 150 else T["bg"]
    plat = d.get("platform") or "Instagram"
    W, H = SIZE.get(plat, (1080, 1080))
    u = min(W, H) / 1080.0
    m = int(90 * u)
    company = (prof.get("company") or "").strip()
    c = prof.get("contact") or {}
    website = (c.get("website") or "").strip()
    handles = (c.get("handles") or "").strip()

    text = _clean(d.get("caption") or "")
    parts = [s for s in re.split(r"(?<=[.!?])\s+", text) if s]
    head = _cut(parts[0] if parts else company, 120)
    sub = _cut(parts[1], 100) if len(parts) > 1 else ""

    img = Image.new("RGB", (W, H), T["bg"])
    draw = ImageDraw.Draw(img)

    rb = int(125 * u)
    num = re.search(r"\b(\d[\d,]{0,4})\b", head)
    label = ""
    if num:
        after = head[num.end():].split()
        label = re.sub(r"\W", "", after[0])[:10] if after else ""

    r = int(50 * u)
    top_y = m + 2 * r
    if num: top_y = m + max(2 * r, 2 * rb)
    top_y += int(40 * u)

    bottom = H - m
    contact = handles if website else "  \u00b7  ".join(x for x in (website, handles) if x)
    hs = int(30 * u)
    contact_y = None
    if contact:
        contact_y = bottom
        bottom -= hs + int(44 * u)

    cta = ""
    if website: cta = "Visit " + website
    elif handles: cta = "Follow " + re.split(r"[\s,]+", handles)[0]
    btn_h = int(124 * u); btn_top = None
    if cta:
        btn_top = bottom - btn_h
        bottom = btn_top - int(50 * u)

    text_w = W - 2 * m
    sfont = F(int(34 * u))
    sub_lines = _wrap(draw, sub, sfont, text_w)[:2] if sub else []
    slh = int(int(34 * u) * 1.3)
    if sub_lines:
        sub_top = bottom - slh * len(sub_lines)
        bottom = sub_top - int(40 * u)

    avail = bottom - top_y - int(52 * u)
    head_words = head.split()
    start = max(int(80 * u * scale), 30)
    font, lines, size = F(24), [head], 24
    for size in range(start, 23, -2):
        font = F(size); lines = _wrap(draw, head, font, text_w)
        too_wide = any(draw.textlength(w, font=font) > text_w for w in head_words)
        if not too_wide and len(lines) <= 5 and int(size * 1.17) * len(lines) <= avail: break
    lh = int(size * 1.17)
    head_top = bottom - lh * len(lines)
    shift = max(0, (head_top - int(52 * u) - top_y) // 2)
    head_top -= shift
    if sub_lines: sub_top -= shift
    if btn_top is not None: btn_top -= shift

    # top-left: logo, or initial circle + company name
    maxw = W - 2 * m - ((2 * rb + int(30 * u)) if num else 0)
    logos = assets.rows("logo"); placed = False
    if logos and show_logo:
        try:
            lg = Image.open(os.path.join(assets.DIR, logos[0]["file"])).convert("RGBA")
            h = int(110 * u); w = int(lg.width * h / lg.height)
            if w > maxw: w = int(maxw); h = int(lg.height * w / lg.width)
            lg = lg.resize((max(w, 1), max(h, 1)))
            img.paste(lg, (m, m), lg); placed = True
        except Exception: pass
    if not placed and company and show_logo:
        draw.ellipse([m, m, m + 2 * r, m + 2 * r], fill=T["accent"])
        draw.text((m + r, m + r), company[0].upper(), font=F(int(44 * u)), fill=on_acc, anchor="mm")
        draw.text((m + 2 * r + int(24 * u), m + r), company, font=F(int(44 * u)), fill=T["head"], anchor="lm")

    # top-right badge with the first number in the headline
    if num:
        cx, cy = W - m - rb, m + rb
        draw.ellipse([cx - rb, cy - rb, cx + rb, cy + rb], fill=T["accent"])
        ns = int((78 if len(num.group(1)) <= 3 else 60) * u)
        draw.text((cx, cy - int(14 * u)), num.group(1), font=F(ns), fill=on_acc, anchor="mm")
        if label:
            draw.text((cx, cy + int(48 * u)), label, font=F(int(30 * u)), fill=on_acc, anchor="mm")

    # accent bar, headline (last words in accent colour)
    draw.rounded_rectangle([m, head_top - int(52 * u), m + int(160 * u), head_top - int(36 * u)], radius=int(8 * u), fill=T["bar"])
    words = head.split()
    if len(lines) >= 2: acc_from = len(words) - len(lines[-1].split())
    elif len(words) >= 4: acc_from = len(words) - 2
    else: acc_from = len(words)
    idx = 0; y = head_top
    for ln in lines:
        x = m
        for w in ln.split():
            draw.text((x, y), w, font=font, fill=T["accent"] if idx >= acc_from else T["head"])
            x += draw.textlength(w + " ", font=font); idx += 1
        y += lh

    if sub_lines:
        y = sub_top
        for ln in sub_lines:
            draw.text((m, y), ln, font=sfont, fill=T["soft"]); y += slh

    if cta:
        bf = F(int(36 * u)); bw = int(draw.textlength(cta, font=bf) + 2 * 64 * u)
        bw = min(bw, W - 2 * m)
        draw.rounded_rectangle([m, btn_top, m + bw, btn_top + btn_h], radius=btn_h // 2, fill=T["btn"])
        draw.text((m + bw // 2, btn_top + btn_h // 2), cta, font=bf, fill=T["btn_text"], anchor="mm")

    if contact_y is not None:
        draw.text((m, contact_y), contact, font=F(hs), fill=T["soft"], anchor="ls")

    if d.get("watermark") in (True, "true", 1):
        try:
            wms = assets.rows("watermark")
            if wms:
                wm = Image.open(os.path.join(assets.DIR, wms[0]["file"])).convert("RGBA")
                w = int(W * 0.22); h = max(int(wm.height * w / wm.width), 1)
                wm = wm.resize((w, h))
                wm.putalpha(wm.split()[3].point(lambda v: int(v * 0.45)))
                img.paste(wm, (W - m - w, H - m - h), wm)
            elif company:
                ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                ImageDraw.Draw(ov).text((W - m, H - m), company, font=F(int(28 * u)), fill=tuple(T["head"]) + (110,), anchor="rs")
                img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
        except Exception: pass

    buf = io.BytesIO(); img.save(buf, "PNG"); raw = buf.getvalue()
    fid = uuid.uuid4().hex[:12]; fn = f"{fid}.png"
    with open(os.path.join(assets.DIR, fn), "wb") as f: f.write(raw)
    with db.LOCK:
        db.C.execute("INSERT INTO assets VALUES(?,?,?,?,?,?,?)", (fid, "generated", "Post image", fn, "image/png", len(raw), db.now())); db.C.commit()
    return assets.rec(db.C.execute("SELECT * FROM assets WHERE id=?", (fid,)).fetchone())
