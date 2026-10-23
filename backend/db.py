"""SQLite storage for Post Genie. Posts keep their full history in `events`."""
import sqlite3, json, os, threading
from datetime import datetime, timezone
PATH = os.getenv("DB_PATH", "postgenie.db")
LOCK = threading.RLock()
C = sqlite3.connect(PATH, check_same_thread=False)
C.row_factory = sqlite3.Row
C.executescript("""
CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT);
CREATE TABLE IF NOT EXISTS posts(id TEXT PRIMARY KEY, data TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS queue(id TEXT PRIMARY KEY, post_id TEXT UNIQUE, data TEXT);
CREATE TABLE IF NOT EXISTS events(n INTEGER PRIMARY KEY AUTOINCREMENT, post_id TEXT, kind TEXT, data TEXT, ts TEXT);
CREATE TABLE IF NOT EXISTS chat(n INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, text TEXT, ts TEXT);
""")
now = lambda: datetime.now(timezone.utc).isoformat(timespec="seconds")
DEFAULT_PROFILE = {"domain": "", "company": "", "owner": "", "contact": {}, "assets": {}, "schemes": [],
                   "banned": [], "tone": "friendly", "hashtags": "", "connected": [],
                   "toggles": {"logo": False, "watermark": False, "contact": False}, "setup_done": False}

def get_profile():
    with LOCK:
        r = C.execute("SELECT data FROM profile WHERE id=1").fetchone()
        return {**DEFAULT_PROFILE, **(json.loads(r[0]) if r else {})}

def set_profile(d):
    p = {**get_profile(), **d}
    with LOCK:
        C.execute("INSERT OR REPLACE INTO profile VALUES(1,?)", (json.dumps(p),)); C.commit()
    return p

def next_id():
    with LOCK:
        n = C.execute("SELECT COUNT(*) FROM posts").fetchone()[0] + 1
        while C.execute("SELECT 1 FROM posts WHERE id=?", (f"PG-{n:04d}",)).fetchone(): n += 1
        return f"PG-{n:04d}"

def save_post(p):
    with LOCK:
        C.execute("INSERT OR REPLACE INTO posts VALUES(?,?,COALESCE((SELECT created FROM posts WHERE id=?),?))",
                  (p["id"], json.dumps(p), p["id"], now())); C.commit()

def get_post(i):
    r = C.execute("SELECT data FROM posts WHERE id=?", (i,)).fetchone()
    return json.loads(r[0]) if r else None

def list_posts():
    return [json.loads(r[0]) for r in C.execute("SELECT data FROM posts ORDER BY created, id")]

def delete_post(i):
    with LOCK: C.execute("DELETE FROM posts WHERE id=?", (i,)); C.commit()

def log(post_id, kind, data):
    with LOCK:
        C.execute("INSERT INTO events(post_id,kind,data,ts) VALUES(?,?,?,?)", (post_id, kind, json.dumps(data), now())); C.commit()

def events(post_id):
    return [dict(post_id=r[0], kind=r[1], data=json.loads(r[2]), ts=r[3]) for r in
            C.execute("SELECT post_id,kind,data,ts FROM events WHERE post_id=? ORDER BY n", (post_id,))]

def queue_by_post(pid):
    r = C.execute("SELECT id,data FROM queue WHERE post_id=?", (pid,)).fetchone()
    return {"id": r[0], **json.loads(r[1]), "post_id": pid} if r else None

def queue_get(sid):
    r = C.execute("SELECT id,post_id,data FROM queue WHERE id=?", (sid,)).fetchone()
    return {"id": r[0], "post_id": r[1], **json.loads(r[2])} if r else None

def queue_all():
    return [{"id": r[0], "post_id": r[1], **json.loads(r[2])} for r in C.execute("SELECT id,post_id,data FROM queue")]

def queue_put(sid, pid, d):
    with LOCK: C.execute("INSERT OR REPLACE INTO queue VALUES(?,?,?)", (sid, pid, json.dumps(d))); C.commit()

def chat_add(role, text):
    with LOCK: C.execute("INSERT INTO chat(role,text,ts) VALUES(?,?,?)", (role, text, now())); C.commit()


def queue_delete(sid):
    col = C.execute("PRAGMA table_info(queue)").fetchall()[0][1]
    with LOCK: C.execute(f"DELETE FROM queue WHERE {col}=?", (sid,)); C.commit()
