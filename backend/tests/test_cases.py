"""TC1-TC4. Run: python tests/test_cases.py  (uses a throwaway database)"""
import os, sys, tempfile
os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db"); sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import db, core
db.set_profile({"connected": ["X", "Instagram"], "schemes": []})
def tc1():
    ps = [core.create_post(dict(platform="X", caption=f"Valid post {i}", date=f"2026-11-0{i+1}", time=f"0{9+i}:00", image="a.jpg")) for i in range(5)]
    for p in ps: core.approve(p["id"]); core.schedule(p["id"])
    got = [db.get_post(p["id"])["verify"]["result"] for p in ps]
    assert got == ["Verified"] * 5 and len(db.queue_all()) == 5, got
    core.schedule(ps[0]["id"]); assert len(db.queue_all()) == 5, "retry must not duplicate"
def tc2():
    p = core.create_post(dict(platform="X", caption="Long caption " * 40, date="2026-11-10", time="10:00", image="a.jpg"))
    assert p["validation"]["revised"] and p["status"] == "Awaiting approval"
    try: core.schedule(p["id"]); assert 0
    except core.Blocked: pass
    core.approve(p["id"], use_revised=True); assert len(db.get_post(p["id"])["approved_caption"]) <= 280
def tc3():
    p = core.create_post(dict(platform="X", caption="Get 70% off all products!", date="2026-11-11", time="10:00", image="a.jpg"))
    assert p["status"] == "Flagged"
    for f in (core.approve, core.schedule):
        try: f(p["id"]); assert 0
        except core.Blocked: pass
    assert not db.queue_by_post(p["id"])
    assert core.update_post(p["id"], {"caption": "Fresh arrivals this week"})["status"] == "Awaiting approval"
def tc4():
    p = core.create_post(dict(platform="Instagram", caption="Photo test", date="2026-11-12", time="10:00", image="reject.png"))
    core.approve(p["id"]); p = core.schedule(p["id"])
    assert p["status"] == "On hold" and not db.queue_by_post(p["id"]), p["status"]
    core.update_post(p["id"], {"image": "ok.jpg"}); core.approve(p["id"]); assert core.schedule(p["id"])["verify"]["result"] == "Verified"
if __name__ == "__main__":
    for t in (tc1, tc2, tc3, tc4):
        try: t(); print(t.__name__.upper(), "PASS")
        except AssertionError as e: print(t.__name__.upper(), "FAIL", e); sys.exit(1)
