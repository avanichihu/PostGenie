"""Post Genie API.  Run: uvicorn main:app --reload"""
import os, db, core, ai, assets, imagegen, billing
from datetime import date, timedelta
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Post Genie API")
app.include_router(assets.router)
app.include_router(imagegen.router)
app.include_router(billing.router)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])

def guard(fn, *a):
    try: return fn(*a)
    except core.Blocked as e: raise HTTPException(409, str(e))
    except TypeError: raise HTTPException(404, "Post not found")

@app.get("/api/profile")
def get_profile(): return db.get_profile()
@app.put("/api/profile")
def put_profile(d: dict = Body(...)): return db.set_profile(d)
@app.post("/api/connect/{platform}")
def connect(platform: str, on: bool = True):
    p = db.get_profile(); c = set(p["connected"]); (c.add if on else c.discard)(platform)
    return db.set_profile({"connected": sorted(c)})
@app.post("/api/plan")
def plan(d: dict = Body(...)):
    prof = db.get_profile(); n, plat = ai.parse_brief(d.get("brief", ""), d.get("platform", "Instagram"))
    if d.get("platform") not in ("Instagram", "Facebook", "X", "LinkedIn", None, ""): plat = d["platform"]
    ideas = [i for i in d.get("ideas", []) if i.strip()]
    if not ideas: raise HTTPException(422, "Add at least one post idea.")
    tone = d.get("tone", prof["tone"])
    brief = d.get("brief", "").lower()
    same_day = any(w in brief for w in ("in a day", "in one day", "in a single day", "same day"))
    caps = ai.plan_captions(ideas, n, tone, prof, plat) or []
    start = date.fromisoformat(d["start_date"]) if d.get("start_date") else None
    billing.consume("posts", n)
    made = []
    for i in range(n):
        cap = caps[i] if i < len(caps) else ai.captions(ideas[i % len(ideas)], tone, prof, 1, i)[0]
        day = start if same_day else (start + timedelta(days=i) if start else None)
        tl = [t.strip() for t in str(d.get("times", "")).split(",") if t.strip()]
        auto = f"{min(21, 9 + i * max(1, 10 // max(n - 1, 1))):02d}:00" if same_day else d.get("time", "10:00")
        tm = tl[i] if i < len(tl) else auto
        made.append(core.create_post(dict(**{k: d[k] for k in ("add_logo", "add_watermark", "add_contact") if k in d}, platform=plat, caption=cap, type=ai.TYPES[i % 7], date=day.isoformat() if day else None, time=tm, image=d.get("image", ""))))
    return made
@app.post("/api/captions")
def captions(d: dict = Body(...)): return ai.captions(d["idea"], d.get("tone", "friendly"), db.get_profile(), d.get("n", 3))
@app.post("/api/rewrite")
def rewrite(d: dict = Body(...)): return ai.rewrite(d["text"], d["mode"], d.get("lang", ""))
@app.get("/api/status")
def status(): return {"ai": bool(os.getenv("GEMINI_API_KEY")), "scheduler": "mock"}
@app.get("/api/posts")
def posts(status: str = "", platform: str = ""):
    return [p for p in db.list_posts() if (not status or p["status"] == status) and (not platform or p["platform"] == platform)]
@app.post("/api/posts")
def new_post(d: dict = Body(...)): return core.create_post(d)
@app.get("/api/posts/{pid}")
def one(pid: str):
    p = db.get_post(pid)
    if not p: raise HTTPException(404, "Post not found")
    return {**p, "history": db.events(pid)}
@app.patch("/api/posts/{pid}")
def edit(pid: str, d: dict = Body(...)): return guard(core.update_post, pid, d)
@app.delete("/api/posts/{pid}")
def delete(pid: str):
    p = db.get_post(pid)
    if p and p.get("sched_id"): db.queue_delete(p["sched_id"])
    db.delete_post(pid); return {"deleted": pid}
@app.post("/api/posts/{pid}/approve")
def approve(pid: str, use_revised: bool = False): return guard(core.approve, pid, use_revised)
@app.post("/api/posts/{pid}/reject")
def reject(pid: str, d: dict = Body(default={})):
    reason = d.get("reason", "")
    p = guard(core.reject, pid, reason)
    if not reason.strip(): return p
    new = ai.revise_for_reason(p["caption"], reason, db.get_profile(), p["platform"])
    if not new: return p
    return guard(core.update_post, pid, {"caption": new, "regen_note": "Rewritten after your rejection: " + reason, "reject_reason": None})
@app.post("/api/posts/{pid}/evidence")
def evidence(pid: str, d: dict = Body(...)): return guard(core.update_post, pid, {"evidence": d["evidence"]})
@app.post("/api/posts/{pid}/schedule")
def schedule(pid: str): return guard(core.schedule, pid)
@app.post("/api/posts/{pid}/reschedule")
def reschedule(pid: str, d: dict = Body(...)): return guard(core.reschedule, pid, d.get("date", ""), d.get("time", ""))
@app.post("/api/posts/{pid}/unschedule")
def unschedule(pid: str): return guard(core.unschedule, pid)
@app.post("/api/posts/{pid}/verify")
def verify(pid: str): return guard(core.verify, pid)
@app.post("/api/verify-all")
def verify_all(): return [core.verify(p["id"]) for p in db.list_posts() if p.get("sched_id")]
@app.get("/api/queue")
def queue(): return db.queue_all()
@app.get("/api/stats")
def stats(): return core.stats()
@app.post("/api/chat")
def chat(d: dict = Body(...)):
    ps = db.list_posts(); ctx = dict(page=d.get("page"), stats=core.stats(), profile={k: v for k, v in db.get_profile().items() if k != "assets"},
        flagged=[(p["id"], [i["m"] for i in p["validation"]["issues"]]) for p in ps if p["status"] == "Flagged"],
        held=[(p["id"], p["fail"]) for p in ps if p["status"] == "On hold"], rejected=[(p["id"], p.get("reject_reason")) for p in ps if p["status"] == "Rejected"])
    db.chat_add("user", d["message"]); q = d["message"].lower()
    r = ai.chat(d["message"], ctx)
    if not r:
        r = ("; ".join(f"{i}: {' '.join(m)}" for i, m in ctx["flagged"]) or "Nothing is flagged.") if "flag" in q or "why" in q else \
            ("; ".join(f"{i}: {m}" for i, m in ctx["held"]) or "Nothing is on hold.") if "hold" in q or "image" in q else \
            ("; ".join(f"{i}: {m}" for i, m in ctx["rejected"]) or "Nothing is rejected.") if "reject" in q else \
            f"{ctx['stats']['total']} posts. By status: {ctx['stats']['by_status']}."
    db.chat_add("genie", r); return {"reply": r, "ai": bool(os.getenv("GEMINI_API_KEY"))}

@app.get("/api/insights")
def insights():
    """DEMO numbers. Replace this function's metrics with real Buffer / Instagram data once real posting is connected."""
    import random
    out = []
    for p in db.list_posts():
        if p["status"] not in ("Scheduled", "Published"): continue
        r = random.Random(p["id"])
        views = r.randint(800, 9000)
        likes = int(views * r.uniform(0.04, 0.12))
        before = r.randint(900, 5000)
        change = r.randint(-15, 60)
        out.append(dict(id=p["id"], platform=p["platform"], caption=p["caption"], date=p.get("date"), time=p.get("time"), status=p["status"],
                        views=views, likes=likes, comments=int(likes * r.uniform(0.03, 0.12)), shares=int(likes * r.uniform(0.02, 0.10)),
                        saves=int(likes * r.uniform(0.05, 0.20)), followers_before=before, followers_after=before + change, follower_change=change, demo=True))
    return sorted(out, key=lambda x: (x["date"] or "", x["time"] or ""), reverse=True)

@app.get("/api/insights")
def insights():
    """DEMO numbers. Replace this function's metrics with real Buffer / Instagram data once real posting is connected."""
    import random
    out = []
    for p in db.list_posts():
        if p["status"] not in ("Scheduled", "Published"): continue
        r = random.Random(p["id"])
        views = r.randint(800, 9000)
        likes = int(views * r.uniform(0.04, 0.12))
        before = r.randint(900, 5000)
        change = r.randint(-15, 60)
        out.append(dict(id=p["id"], platform=p["platform"], caption=p["caption"], date=p.get("date"), time=p.get("time"), status=p["status"],
                        views=views, likes=likes, comments=int(likes * r.uniform(0.03, 0.12)), shares=int(likes * r.uniform(0.02, 0.10)),
                        saves=int(likes * r.uniform(0.05, 0.20)), followers_before=before, followers_after=before + change, follower_change=change, demo=True))
    return sorted(out, key=lambda x: (x["date"] or "", x["time"] or ""), reverse=True)
