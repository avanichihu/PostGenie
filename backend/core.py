"""Post Genie workflow: validate -> approve -> schedule -> verify. No step is skipped."""
import re, uuid, db
LIM = {"Instagram": 2200, "X": 280, "LinkedIn": 3000, "Facebook": 63206}
CLAIM = re.compile(r"\b\d{1,3}\s?%\s?off\b|\bfree\b|\bbuy one get one\b|\bbogo\b|\bclearance\b", re.I)

class Blocked(Exception): pass

def validate(p, prof):
    cap, lim, issues, res, rev = p["caption"], LIM.get(p["platform"], 2200), [], "Passed", None
    if len(cap) > lim:
        issues.append(dict(k="limit", m=f"Caption is {len(cap)} characters; {p['platform']} allows {lim}."))
        rev = cap[:lim - 1].rsplit(" ", 1)[0] + "…"; res = "Needs revision approval"
    m = CLAIM.search(cap)
    if m and not (any(m.group(0).lower() in o.lower() for o in prof.get("schemes", [])) or p.get("evidence", "").strip()):
        issues.append(dict(k="claim", m=f'Unsupported claim detected ("{m.group(0)}"). Please provide evidence or remove this statement.')); res = "Flagged"
    for w in prof.get("banned", []):
        if w and w.lower() in cap.lower(): issues.append(dict(k="brand", m=f'Prohibited word: "{w}".')); res = "Flagged"
    if res == "Passed" and re.search(r"\bbest\b|#1|guarantee", cap, re.I):
        issues.append(dict(k="verify", m="Superlative needs manual verification.")); res = "Needs manual verification"
    if p["platform"] == "Instagram" and not p.get("image"):
        issues.append(dict(k="img", m="Instagram posts need an image.")); res = "Flagged"
    return dict(result=res, issues=issues, revised=rev, evidence=p.get("evidence", ""), ts=db.now())

def revalidate(p):
    v = validate(p, db.get_profile()); p["validation"] = v
    db.log(p["id"], "validation", {"original": p["caption"], **v})
    if v["result"] == "Flagged": p["status"] = "Flagged"
    elif p["status"] in ("Draft", "Flagged", "Awaiting approval"): p["status"] = "Awaiting approval"
    db.save_post(p); return p

def create_post(d):
    t = db.get_profile()["toggles"]
    p = {"id": db.next_id(), "platform": "Instagram", "type": "Promotional", "status": "Draft", "image": "", "evidence": "",
         "approved_caption": None, "sched_id": None, "fail": None, "verify": None,
         "add_logo": t["logo"], "add_watermark": t["watermark"], "add_contact": t["contact"], **d}
    return revalidate(p)

def update_post(pid, d):
    p = db.get_post(pid)
    if p["status"] in ("Scheduled", "Published"): raise Blocked("Scheduled posts can't be edited. Reschedule instead.")
    p.update(d); p["approved_caption"] = None; p["status"] = "Draft"; p["fail"] = None
    return revalidate(p)

def approve(pid, use_revised=False):
    p = db.get_post(pid)
    if p["status"] == "Flagged": raise Blocked("Resolve the flag first: add evidence or edit the caption.")
    text = p["validation"]["revised"] if use_revised and p["validation"]["revised"] else p["caption"]
    if len(text) > LIM.get(p["platform"], 2200): raise Blocked("Still over the platform limit. Approve the shortened draft.")
    p["caption"] = p["approved_caption"] = text; p["status"] = "Approved"
    db.log(pid, "approval", {"approved_text": text, "version_used": "revised" if use_revised else "original"}); db.save_post(p); return p

def reject(pid, reason):
    p = db.get_post(pid); p["status"] = "Rejected"; p["reject_reason"] = reason or "No reason given"
    db.log(pid, "rejection", {"reason": p["reject_reason"]}); db.save_post(p); return p

class MockScheduler:
    """Stand-in for Buffer. Idempotent per post; rejects bad or missing images like a real one would."""
    def submit(self, p):
        q = db.queue_by_post(p["id"])
        if q: return dict(ok=True, id=q["id"], dup=True)
        img = p.get("image", "")
        if re.search("reject", img, re.I) or (p["platform"] == "Instagram" and not img):
            return dict(ok=False, err="Scheduler rejected the image (unsupported format or size)")
        sid = "BUF-" + uuid.uuid4().hex[:6].upper()
        db.queue_put(sid, p["id"], dict(channel=p["platform"], date=p["date"], time=p["time"], media=bool(img), text=p["approved_caption"]))
        return dict(ok=True, id=sid)
    def read(self, sid): return db.queue_get(sid)
SCHED = MockScheduler()

def schedule(pid):
    p = db.get_post(pid)
    if p["status"] in ("Scheduled", "Published"): return p
    if not p.get("approved_caption") or p["status"] not in ("Approved", "On hold"): raise Blocked("This post must be approved before scheduling.")
    if p["platform"] not in db.get_profile()["connected"]: raise Blocked(f"Connect {p['platform']} first. Posts can't be scheduled without a connected account.")
    r = SCHED.submit(p); db.log(pid, "schedule", r)
    if not r["ok"]:
        p["status"] = "On hold"; p["fail"] = r["err"]; db.save_post(p); return p
    p["sched_id"], p["status"], p["fail"] = r["id"], "Scheduled", None; db.save_post(p)
    return verify(pid)

def verify(pid):
    p = db.get_post(pid)
    if not p.get("sched_id"): raise Blocked("Nothing to verify: this post has no scheduler record.")
    q = SCHED.read(p["sched_id"]); diff = []
    if not q: res = "Scheduler unavailable"
    else:
        for k, a, b in (("post", pid, q["post_id"]), ("date", p["date"], q["date"]), ("time", p["time"], q["time"]),
                        ("channel", p["platform"], q["channel"]), ("text", p["approved_caption"], q["text"]), ("media", bool(p["image"]), q["media"])):
            if a != b: diff.append(k)
        res = "Mismatch detected" if diff else "Verified"
    p["verify"] = dict(result=res, diff=diff, observed=q, ts=db.now()); db.log(pid, "verification", p["verify"]); db.save_post(p); return p

def stats():
    ps, by, st = db.list_posts(), {}, {}
    for p in ps: by[p["platform"]] = by.get(p["platform"], 0) + 1; st[p["status"]] = st.get(p["status"], 0) + 1
    day = {}
    for p in ps: day[p["date"]] = day.get(p["date"], 0) + 1
    return dict(total=len(ps), by_status=st, by_platform=by, by_day=day, queue=len(db.queue_all()))


def reschedule(pid, date, time):
    """Change a post's date/time. Keeps approval. Scheduled posts are updated in the scheduler and re-verified."""
    from datetime import datetime
    p = db.get_post(pid)
    if not p: raise Blocked("Post not found.")
    try: when = datetime.fromisoformat(f"{date}T{time}")
    except ValueError: raise Blocked("Please choose a valid date and time.")
    if when < datetime.now(): raise Blocked("That date and time is in the past. Choose a future time.")
    if p["status"] == "Scheduled" and p.get("sched_id"):
        p["date"], p["time"] = date, time
        db.queue_put(p["sched_id"], pid, dict(channel=p["platform"], date=date, time=time, media=bool(p.get("image")), text=p["approved_caption"]))
        db.log(pid, "reschedule", {"date": date, "time": time}); db.save_post(p)
        return verify(pid)
    if p["status"] in ("Approved", "On hold"):
        p["date"], p["time"] = date, time
        db.log(pid, "reschedule", {"date": date, "time": time}); db.save_post(p)
        return schedule(pid)
    raise Blocked("Approve this post first, then choose its date and time.")


def unschedule(pid):
    """Remove a scheduled post from the scheduler and send it back for approval."""
    p = db.get_post(pid)
    if not p: raise Blocked("Post not found.")
    if p["status"] != "Scheduled" or not p.get("sched_id"): raise Blocked("This post is not scheduled.")
    db.queue_delete(p["sched_id"])
    db.log(pid, "unschedule", {"sched_id": p["sched_id"]})
    p["sched_id"], p["status"], p["approved_caption"], p["verify"], p["fail"] = None, "Awaiting approval", None, None, None
    db.save_post(p); return p
