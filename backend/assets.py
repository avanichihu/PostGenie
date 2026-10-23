"""Brand assets (logo, watermark, sample images): files on disk, details in SQLite."""
import os, re, base64, uuid
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import Response
import db

router = APIRouter()
DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(DIR, exist_ok=True)
db.C.execute("CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY, kind TEXT, name TEXT, file TEXT, mime TEXT, size INTEGER, created TEXT)")
db.C.commit()
LIMITS = {"logo": 1, "watermark": 1, "sample": 3}
EXT = {"image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp"}
MAX = 5 * 1024 * 1024
DATA = re.compile(r"^data:(image/[a-z+.-]+);base64,(.+)$", re.S)

def rec(r): return dict(id=r["id"], kind=r["kind"], name=r["name"], mime=r["mime"], size=r["size"], url=f"/api/assets/{r['id']}/file")

def rows(kind=None):
    q = "SELECT * FROM assets" + (" WHERE kind=?" if kind else "") + " ORDER BY rowid"
    return db.C.execute(q, (kind,) if kind else ()).fetchall()

def _remove(r):
    try: os.remove(os.path.join(DIR, r["file"]))
    except FileNotFoundError: pass
    with db.LOCK: db.C.execute("DELETE FROM assets WHERE id=?", (r["id"],)); db.C.commit()

def _save(kind, name, mime, raw):
    existing = rows(kind)
    if kind == "sample":
        if len(existing) >= LIMITS[kind]: raise HTTPException(409, "You already have 3 sample images. Delete one to add another.")
    else:
        for r in existing: _remove(r)
    fid = uuid.uuid4().hex[:12]; fn = f"{fid}.{EXT[mime]}"
    with open(os.path.join(DIR, fn), "wb") as f: f.write(raw)
    clean = re.sub(r"[^\w .()-]", "", name)[:80] or "image"
    with db.LOCK:
        db.C.execute("INSERT INTO assets VALUES(?,?,?,?,?,?,?)", (fid, kind, clean, fn, mime, len(raw), db.now())); db.C.commit()
    return db.C.execute("SELECT * FROM assets WHERE id=?", (fid,)).fetchone()

def _import_old():
    prof = db.get_profile()
    if prof.get("assets_migrated"): return
    old = prof.get("assets") or {}
    items = [("logo", old.get("logo")), ("watermark", old.get("watermark"))] + [("sample", s) for s in (old.get("samples") or [])[:3]]
    for kind, val in items:
        m = DATA.match(val or "")
        if not m or m.group(1) not in EXT: continue
        try: raw = base64.b64decode(m.group(2))
        except Exception: continue
        if len(raw) <= MAX:
            try: _save(kind, f"{kind} (from setup)", m.group(1), raw)
            except HTTPException: pass
    db.set_profile({"assets_migrated": True})

@router.get("/api/assets")
def list_assets():
    _import_old()
    return [rec(r) for r in rows()]

@router.post("/api/assets")
def upload(d: dict = Body(...)):
    kind = d.get("kind")
    if kind not in LIMITS: raise HTTPException(422, "Kind must be logo, watermark or sample.")
    m = DATA.match(d.get("data", "") or "")
    if not m or m.group(1) not in EXT: raise HTTPException(422, "Please upload a PNG, JPG, GIF or WebP image.")
    try: raw = base64.b64decode(m.group(2), validate=True)
    except Exception: raise HTTPException(422, "That file could not be read.")
    if len(raw) > MAX: raise HTTPException(413, "That image is too large (limit 5 MB).")
    return rec(_save(kind, d.get("name") or "image", m.group(1), raw))

@router.get("/api/assets/{aid}/file")
def asset_file(aid: str):
    r = db.C.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone()
    if not r: raise HTTPException(404, "Image not found")
    try:
        with open(os.path.join(DIR, r["file"]), "rb") as f: return Response(f.read(), media_type=r["mime"])
    except FileNotFoundError: raise HTTPException(404, "Image file is missing")

@router.delete("/api/assets/{aid}")
def delete_asset(aid: str):
    r = db.C.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone()
    if not r: raise HTTPException(404, "Image not found")
    _remove(r); return {"deleted": aid}
