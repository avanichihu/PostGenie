# 🧞 PostGenie

**AI-powered social media post scheduler. Your wishes, our magic.**

Built for the **Agentic AI Hackathon 2026** (powered by Ziro.Digital) by **Team CODZILLA**.

🎥 **Demo video:** `<ADD DEMO VIDEO LINK>`
🌐 **Live demo:** `<ADD LIVE DEMO LINK, OR DELETE THIS LINE>`
📊 **Presentation:** https://claude.ai/artifact/QnvAQhSUsyUWSJt4F5dmRU

---

## 💡 The Problem

Creators and small businesses struggle with five things:

| Pain point | How PostGenie helps |
|---|---|
| "What should I post today?" | AI-generated ideas, captions and hashtags |
| "Posting everywhere takes hours." | One composer for every platform |
| "When is my audience online?" | Smart best-time scheduling |
| "My posts look the same everywhere." | Tone, length and hashtags adapted per platform |
| "Did any of it actually work?" | Likes, comments, views and audience stats in one place |

**From scattered posting → to a single, intelligent publishing workflow.**

## ✨ Features

- **AI caption generator:** Gemini writes captions and hashtags
- **Bulk post requests:** ask for 7 posts a week or 4 a day
- **Preview before posting:** review every generated post
- **Approve or reject:** every rejection must carry a reason
- **Smart regeneration:** fixable rejection reasons get a fresh draft
- **Auto-post on schedule:** posts go live at the chosen date and time
- **History tab:** likes, comments and views for every post
- **Audience breakdown:** women, men and more, per post

## 🔄 How It Works

```
Post request → Gemini generator → Preview → Approve / Reject
                                                 │
              Fixable reason? ← Reason check ←───┘ (reject)
                    │ regenerate → Preview again

Approve → Approved queue → Mock scheduler → Auto-post
                                                 │
                       History tab ← Engagement stats + Audience breakdown
```

**Example:** Maya, a bakery owner, types *"Promote our new sourdough launch this Saturday on Instagram, LinkedIn and X."* PostGenie writes a tailored post for each platform, adds hashtags and emojis, picks the best time and queues it for auto-publish.

## 🛠 Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React / Next.js, Tailwind CSS |
| Backend | Node.js |
| Database | PostgreSQL, Supabase |
| AI | Gemini API |
| Auth | OAuth 2.0 |
| Scheduler | Mock scheduler (runs on port 8001) |

> ⚠️ Edit this table to match your code exactly (for example Vite vs Next.js).

## 📁 Project Structure

```
PostGenie/
├── frontend/   # Web app (UI, post preview, history tab)
├── backend/    # API server, Gemini integration, scheduler
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)
- A PostgreSQL / Supabase database

### 1. Clone the repo

```bash
git clone https://github.com/avanichihu/PostGenie.git
cd PostGenie
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env     # then fill in your own values
npm install
npm start
```

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed in your terminal.

> ⚠️ Replace the commands above with the exact ones your project uses if they differ.

### Environment variables

Create a `.env` file in `backend/`. Never commit it.

```
GEMINI_API_KEY=
DATABASE_URL=
SCHEDULER_PORT=8001
```

## 🗺 Roadmap

| Now | Next | Later |
|---|---|---|
| AI caption generation | History & audience stats | More platforms (TikTok, YouTube Shorts, Pinterest) |
| Bulk post requests | Team collaboration | Multilingual posting |
| Approve or reject with regeneration | Brand voice learning | Integrations & API (Zapier, Slack, CMS) |
| Auto-posting | Media & image generation | Mobile app |

## 👩‍💻 Team CODZILLA

- **Avani Jain**
- **Ganavi KT**

## 📄 License

Built for the Agentic AI Hackathon 2026. 
