---
name: Floating Advisor Chat Engine
description: Global ChatGPT-like floating chat for industry AI advisors. Auto-resume per (user, industry). Lazy-load 50 msgs. Tables advisor_threads + advisor_messages with RLS.
type: feature
---
Mounted once in App.tsx via <FloatingAdvisorChatProvider>. Per (user, industry) one thread (advisor_threads). Messages (advisor_messages) lazy-paginated 50 at a time, oldest loaded on scroll-up. Window states: closed | open | minimized | maximized; persisted. Mac-style controls left (red=close, amber=min, green=max). Draft autosaves every 10s + on beforeunload. Sidebar "AI Advisor" item dispatches window event "open-advisor-chat"; /advisor route also auto-opens. Streaming today = char-chunk simulation over replitCall(/advisor/:industry); replace with real SSE later. When industry changes (e.g. owner switches workspace), thread auto-resets to that industry's thread — never mixes industries.
