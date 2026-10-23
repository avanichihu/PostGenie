"""Real image generation with Gemini, using the saved logo and sample images as references."""
import os, json, base64, uuid, urllib.request, urllib.error
from fastapi import APIRouter, HTTPException, Body
import db, assets, freeimg, billing

router = APIRouter()
MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")
RATIO = {"Instagram": "1:1", "Facebook": "4:3", "X": "16:9", "LinkedIn": "4:3"}

def _refs(show_logo=True):
    out = []
    for r in (assets.rows("logo") if show_logo else []) + assets.rows("sample"):
        try:
            with open(os.path.join(assets.DIR, r["file"]), "rb") as f:
                out.append((r["mime"], base64.b64encode(f.read()).decode()))
        except FileNotFoundError:
            pass
    return out

@router.post("/api/generate-image")
def generate(d: dict = Body(...)):
    billing.consume("images")
    if os.getenv("IMAGE_MODE", "free").lower() != "gemini": return freeimg.compose(d)
    key = os.getenv("GEMINI_API_KEY")
    if not key: raise HTTPException(400, "Add GEMINI_API_KEY to backend/.env to generate images.")
    prof = db.get_profile()
    caption = (d.get("caption") or "").strip()[:600]
    plat = d.get("platform") or "Instagram"
    show_logo = d.get("logo", True) not in (False, "false", 0)
    refs = _refs(show_logo)
    prompt = (f"Create a social media image for a {prof.get('domain') or 'small business'} brand"
              f"{' called ' + prof['company'] if prof.get('company') else ''}. "
              f"It will go with this {plat} post: \"{caption}\". "
              "Make it clean, eye-catching and professional. Do not put any text or captions in the image. ")
    if show_logo and refs:
        prompt += "The attached images are the brand's logo and sample images. Match their colours, style and mood. Do not distort the logo."
    elif refs:
        prompt += "The attached images are sample images only. Match their colours, style and mood. Do NOT include any logo, brand mark, emblem or watermark in the image."
    else:
        prompt += "Do NOT include any logo, brand mark, emblem or watermark in the image."
    parts = [{"text": prompt}] + [{"inlineData": {"mimeType": m, "data": b}} for m, b in refs]
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": RATIO.get(plat, "1:1")}}}
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: res = json.load(r)
    except urllib.error.HTTPError as e:
        try: msg = json.load(e)["error"]["message"]
        except Exception: msg = str(e)
        hint = (" Image generation needs billing turned on in Google AI Studio." if e.code in (403, 429)
                else " Set GEMINI_IMAGE_MODEL in backend/.env to a current image model." if e.code == 404 else "")
        raise HTTPException(502, f"Gemini said: {msg[:200]}.{hint}")
    except Exception as e:
        raise HTTPException(502, "Could not reach Gemini: " + str(e)[:120])
    for c in res.get("candidates", []):
        for p in (c.get("content") or {}).get("parts", []):
            im = p.get("inlineData") or p.get("inline_data")
            if not im: continue
            mime = im.get("mimeType") or im.get("mime_type") or "image/png"
            if mime not in assets.EXT: mime = "image/png"
            raw = base64.b64decode(im["data"])
            fid = uuid.uuid4().hex[:12]; fn = f"{fid}.{assets.EXT[mime]}"
            with open(os.path.join(assets.DIR, fn), "wb") as f: f.write(raw)
            with db.LOCK:
                db.C.execute("INSERT INTO assets VALUES(?,?,?,?,?,?,?)", (fid, "generated", "Generated image", fn, mime, len(raw), db.now())); db.C.commit()
            return assets.rec(db.C.execute("SELECT * FROM assets WHERE id=?", (fid,)).fetchone())
    raise HTTPException(502, "Gemini did not return an image. It may have declined this caption. Try again.")


# --- delete a saved image ---
import os as _os
import db as _db
import assets as _assets
from fastapi import HTTPException as _HTTPException

@router.post("/api/image-delete/{aid}")
def image_delete(aid: str):
    with _db.LOCK:
        row = _db.C.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone()
        if not row: raise _HTTPException(404, "Image not found")
        fn = row[3]
        _db.C.execute("DELETE FROM assets WHERE id=?", (aid,)); _db.C.commit()
    try: _os.remove(_os.path.join(_assets.DIR, fn))
    except Exception: pass
    return {"ok": True}
