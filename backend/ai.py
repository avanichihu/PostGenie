"""AI layer. Uses Gemini when GEMINI_API_KEY is set; otherwise clear template fallbacks (labelled)."""
import os, json, re, urllib.request
def llm(prompt):
    k = os.getenv("GEMINI_API_KEY")
    if not k: return None
    import time
    model = os.getenv('GEMINI_MODEL', 'gemini-3.8-flash')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
    for attempt in range(3):
        req = urllib.request.Request(url, body, {"Content-Type": "application/json", "x-goog-api-key": k})
        try:
            return json.load(urllib.request.urlopen(req, timeout=40))["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print("GEMINI ERROR:", e)
            time.sleep(2)
    return None
HOOK = ["Meet", "Behind the scenes with", "Did you know about", "Tell us:", "Fresh news:", "Loved by you:", "A little something about"]
TYPES = ["Product showcase", "Educational", "Engagement", "Behind the scenes", "Promotional", "Customer testimonials", "Informational"]
def captions(idea, tone, prof, n=3, start=0):
    ctx = f"Business: {prof.get('company')} ({prof.get('domain')}). Tone: {tone}. Never invent discounts. Approved offers: {prof.get('schemes')}. Banned words: {prof.get('banned')}."
    out = llm(f"{ctx}\nWrite {n} distinct social captions for: {idea}. Return only a JSON list of strings.")
    if out:
        try: return json.loads(re.sub(r"```json|```", "", out).strip())[:n]
        except Exception: pass
    return [f"{HOOK[(start + i) % 7]} {idea}{' at ' + prof['company'] if prof.get('company') else ''} {prof.get('hashtags', '')}".strip() for i in range(n)]
def parse_brief(text, default_platform="Instagram"):
    t, nums = text.lower(), {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7}
    m = re.search(r"\b(\d+|one|two|three|four|five|six|seven)\b", t)
    n = min(14, nums.get(m.group(1)) or int(m.group(1))) if m else 7
    plat = next((p for p in ("Instagram", "X", "LinkedIn", "Facebook") if p.lower() in t.split() or p.lower() in t), default_platform)
    return n, plat
def chat(message, context):
    return llm(f"You are the Post Genie assistant. Use only this app data: {json.dumps(context)[:3500]}\nUser: {message}\nAnswer briefly.")

def rewrite(text, mode, lang=""):
    P = {"shorten": "Shorten this caption to under 140 characters, keep meaning and tone.", "rewrite": "Rewrite this caption with a fresh angle, same facts.",
         "grammar": "Fix grammar only, change nothing else.", "translate": f"Translate this caption into {lang}."}
    out = llm(f"{P[mode]} Do not add offers or claims. Return only the caption.\n\n{text}")
    if out: return {"text": out.strip(), "ai": True}
    if mode == "shorten": return {"text": text if len(text) <= 140 else text[:139].rsplit(" ", 1)[0] + "…", "ai": False}
    return {"text": text, "ai": False, "note": "This needs an AI key (GEMINI_API_KEY). Text unchanged."}

def plan_captions(ideas, n, tone, prof, platform="Instagram"):
    ctx = f"Business: {prof.get('company')} ({prof.get('domain')}). Platform: {platform}. Tone: {tone}. Never invent discounts or offers. Approved offers: {prof.get('schemes')}. Banned words: {prof.get('banned')}. Brand hashtags: {prof.get('hashtags')}."
    out = llm(f"{ctx}\nWrite exactly {n} different social media posts, each with a different angle. Use these ideas, cycling through them if there are fewer ideas than posts: {ideas}. Each caption must be complete and ready to post, and must end with 3 to 5 relevant hashtags. Return only a JSON list of {n} strings.")
    if out:
        try:
            lst = json.loads(re.sub(r"```json|```", "", out).strip())
            if isinstance(lst, list): return [str(x) for x in lst[:n]]
        except Exception: pass
    return None

def revise_for_reason(caption, reason, prof, platform):
    ctx = f"Business: {prof.get('company')} ({prof.get('domain')}). Platform: {platform}. Never invent discounts or offers. Banned words: {prof.get('banned')}."
    out = llm(f"{ctx}\nA reviewer rejected this social media caption.\nCaption: {caption}\nReason: {reason}\nIf the reason can be fixed by editing the caption, return ONLY the improved caption, keeping 3 to 5 hashtags. If the reason cannot be fixed by editing the text (for example the person does not want this post at all, or the reason is unclear), return exactly CANNOT_FIX.")
    if not out: return None
    out = out.strip()
    return None if "CANNOT_FIX" in out else out
