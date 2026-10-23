"""Plans and weekly usage limits. Demo mode: upgrading needs no payment yet."""
import datetime
from fastapi import APIRouter, HTTPException, Body
import db

router = APIRouter()
PLANS = {
    "free":    {"name": "Free",    "price": 0,    "posts": 3,   "images": 3},
    "starter": {"name": "Starter", "price": 499,  "posts": 7,  "images": 7},
    "pro":     {"name": "Pro",     "price": 1499, "posts": 20, "images": 20},
}
with db.LOCK:
    db.C.execute("CREATE TABLE IF NOT EXISTS billing(k TEXT PRIMARY KEY, v TEXT)")
    db.C.execute("CREATE TABLE IF NOT EXISTS usage(week TEXT, kind TEXT, n INTEGER, PRIMARY KEY(week, kind))")
    db.C.commit()

def _week():
    y, w, _ = datetime.date.today().isocalendar()
    return f"{y}-W{w:02d}"

def current_plan():
    r = db.C.execute("SELECT v FROM billing WHERE k='plan'").fetchone()
    return r[0] if r and r[0] in PLANS else "free"

def used(kind):
    r = db.C.execute("SELECT n FROM usage WHERE week=? AND kind=?", (_week(), kind)).fetchone()
    return r[0] if r else 0

def consume(kind, n=1):
    """Call before generating. Raises 402 if the weekly limit would be exceeded."""
    p = PLANS[current_plan()]
    if used(kind) + n > p[kind]:
        raise HTTPException(402, f"{p['name']} plan limit reached: {p[kind]} {kind} per week. Upgrade to continue.")
    with db.LOCK:
        db.C.execute("INSERT INTO usage VALUES(?,?,?) ON CONFLICT(week,kind) DO UPDATE SET n=n+?", (_week(), kind, n, n))
        db.C.commit()

@router.get("/api/billing")
def status():
    pid = current_plan()
    today = datetime.date.today()
    reset = today + datetime.timedelta(days=7 - today.weekday())
    return {"plan": pid, "plans": PLANS, "reset": reset.isoformat(),
            "usage": {"posts": used("posts"), "images": used("images")}, "limits": PLANS[pid]}

@router.post("/api/billing/plan")
def choose(d: dict = Body(...)):
    if d.get("plan") not in PLANS: raise HTTPException(422, "Unknown plan.")
    with db.LOCK:
        db.C.execute("INSERT INTO billing VALUES('plan',?) ON CONFLICT(k) DO UPDATE SET v=?", (d["plan"], d["plan"]))
        db.C.commit()
    return status()
