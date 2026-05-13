import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { formatAiText } from '../utils/formatAiText';

const SUGGESTED_SIDEBAR = [
  'Why is my RV AC not cooling?',
  'Best way to troubleshoot electrical issue?',
  'Water leak in plumbing—what to check first?',
  'Battery draining fast—what could be wrong?',
  "Generator won't start—steps to diagnose?",
  'Recommended maintenance routine?'
];

const WELCOME_SUGGESTIONS = [
  { q: 'why did my fridge stop working ?' },
  { q: 'why wont my awning open?' },
  { q: 'why is my RV stinky?' }
];

function isIOS() {
  return /iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function Chat() {
  const navigate = useNavigate();
  const threadRef = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [me, setMe] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [suggestedOpen, setSuggestedOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  const logoUrl = process.env.REACT_APP_LOGO_URL || '';
  const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@example.com';

  useEffect(() => {
    document.body.classList.add('rvbot-app-page');
    if (isIOS()) document.body.classList.add('iphone-device');
    return () => {
      document.body.classList.remove('rvbot-app-page', 'iphone-device');
    };
  }, []);

  const loadMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setMe(res.data);
    } catch {
      setMe(null);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadMe();
    loadSessions();
  }, [loadMe, loadSessions]);

  const showWelcome = messages.length === 0 && !streaming;

  const scrollThreadBottom = () => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollThreadBottom();
  }, [messages, typing]);

  const loadSession = async (sessionId) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      setCurrentSession(sessionId);
      setMessages((res.data.messages || []).map((m) => ({
        role: m.role,
        content: m.content
      })));
      setMobileOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.post('/chat/sessions');
      setCurrentSession(res.data.sessionId);
      setMessages([]);
      await loadSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/chat/sessions/${deleteTarget}`);
      if (currentSession === deleteTarget) {
        setCurrentSession(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const techCallsLeft = me?.subscription
    ? (typeof me.subscription.techCallsRemaining === 'number'
      ? me.subscription.techCallsRemaining
      : Math.max(0, (me.subscription.techCalls || 0) - (me.subscription.techCallsUsed || 0)))
    : 0;
  const techMins = me?.subscription?.techCallMinutes || 30;

  const sendMessage = async (e, textOverride) => {
    e?.preventDefault?.();
    const text = (textOverride != null ? String(textOverride) : input).trim();
    if (!text || streaming) return;
    if (textOverride == null) setInput('');

    const priorHistory = messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content
    }));

    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const res = await api.post('/chat/sessions');
        sessionId = res.data.sessionId;
        setCurrentSession(sessionId);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setTyping(true);

    const API_URL = process.env.REACT_APP_API_URL || 'https://rv-bot-backend.vercel.app/api';
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: priorHistory,
          stream: true
        })
      });

      if (response.status === 403 || response.status === 401) {
        setTyping(false);
        setStreaming(false);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Active subscription required. Please check your plan or contact support.' }
        ]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            setTyping(false);
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              const errMsg = parsed.message || parsed.error || 'Error';
              setTyping(false);
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === 'assistant') {
                  next[next.length - 1] = { role: 'assistant', content: errMsg };
                }
                return next;
              });
            } else if (parsed.chunk) {
              setTyping(false);
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === 'assistant') {
                  next[next.length - 1] = {
                    role: 'assistant',
                    content: (last.content || '') + parsed.chunk
                  };
                }
                return next;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
      await loadSessions();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your message.' }
      ]);
    } finally {
      setTyping(false);
      setStreaming(false);
    }
  };

  const onCopyAssistant = (content) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = formatAiText(content);
    const plain = tmp.innerText || content;
    navigator.clipboard.writeText(plain).catch(() => {});
  };

  return (
    <div id="rvbot-app-root">
      <div className={`rvbot-left ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="rvbot-left-header">
          <div className="rvbot-left-logo">
            {logoUrl ? <img id="rvbot-left-logo" alt="Logo" src={logoUrl} /> : null}
          </div>
          <div className="rvbot-left-actions">
            <button
              type="button"
              className="rvbot-left-close"
              id="rvbot-left-close"
              aria-label="Close sidebar"
              onClick={() => { setMobileOpen(false); }}
            >
              ×
            </button>
            <button
              type="button"
              className="rvbot-left-toggle"
              id="rvbot-left-toggle"
              aria-label="Collapse sidebar"
              onClick={() => setSidebarCollapsed((c) => !c)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="rvbot-left-scroll">
          <div className="rvbot-section">
            <div
              className="rvbot-section-header"
              role="button"
              tabIndex={0}
              onClick={() => setSuggestedOpen((o) => !o)}
              onKeyDown={(ev) => ev.key === 'Enter' && setSuggestedOpen((o) => !o)}
            >
              <h2>Suggested</h2>
              <svg
                className="rvbot-dropdown-icon"
                style={{ transform: suggestedOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={`rvbot-list rvbot-qs ${suggestedOpen ? 'open' : ''}`}>
              {SUGGESTED_SIDEBAR.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="rvbot-suggested-btn"
                  onClick={() => { setInput(q); }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="rvbot-section">
            <div
              className="rvbot-section-header"
              role="button"
              tabIndex={0}
              onClick={() => setHistoryOpen((o) => !o)}
              onKeyDown={(ev) => ev.key === 'Enter' && setHistoryOpen((o) => !o)}
            >
              <h2>History</h2>
              <svg
                className="rvbot-dropdown-icon"
                style={{ transform: historyOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={`rvbot-list rvbot-history ${historyOpen ? 'open' : ''}`}>
              {sessions.length === 0 ? (
                <div className="rvbot-history-empty">No chat history yet</div>
              ) : (
                sessions.map((session) => {
                  const date = new Date(session.updatedAt);
                  const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                  const active = session.sessionId === currentSession;
                  return (
                    <div
                      key={session.sessionId}
                      className={`rvbot-history-item${active ? ' active' : ''}`}
                    >
                      <div
                        className="rvbot-history-content"
                        role="button"
                        tabIndex={0}
                        onClick={() => loadSession(session.sessionId)}
                        onKeyDown={(ev) => ev.key === 'Enter' && loadSession(session.sessionId)}
                      >
                        <div className="rvbot-history-text">{session.title}</div>
                        <div className="rvbot-history-time">{timeStr}</div>
                      </div>
                      <button
                        type="button"
                        className="rvbot-delete-btn"
                        title="Delete chat"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(session.sessionId); }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="rvbot-user-footer">
          <div className="rvbot-user-chip">
            <div>
              {(me && me.name) || (me && me.email) || 'User'}
              {' • '}
              {me?.subscription ? `Active until ${new Date(me.subscription.endDate).toLocaleDateString()}` : 'No plan'}
            </div>
          </div>
          {techCallsLeft > 0 ? (
            <button type="button" className="rvbot-tech-call-btn" id="rvbot-tech-call-btn" onClick={() => setTechModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {` Tech Call (${techCallsLeft} left)`}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rvbot-main">
        <div className="rvbot-topbar">
          <button
            type="button"
            className="rvbot-menu-btn"
            id="rvbot-menu-btn"
            aria-label="Open sidebar"
            onClick={() => { setMobileOpen(true); }}
          >
            ☰
          </button>
          <div className="title">
            {logoUrl ? <img id="rvbot-logo" alt="RV Assistant" src={logoUrl} /> : <span>RV Journey Genie</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" className="rvbot-new-chat-btn" id="new-chat-btn" aria-label="New chat" onClick={createNewSession}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.6687 11.333V8.66699C2.6687 7.74455 2.66841 7.01205 2.71655 6.42285C2.76533 5.82612 2.86699 5.31731 3.10425 4.85156L3.25854 4.57617C3.64272 3.94975 4.19392 3.43995 4.85229 3.10449L5.02905 3.02149C5.44666 2.84233 5.90133 2.75849 6.42358 2.71582C7.01272 2.66769 7.74445 2.66797 8.66675 2.66797H9.16675C9.53393 2.66797 9.83165 2.96586 9.83179 3.33301C9.83179 3.70028 9.53402 3.99805 9.16675 3.99805H8.66675C7.7226 3.99805 7.05438 3.99834 6.53198 4.04102C6.14611 4.07254 5.87277 4.12568 5.65601 4.20313L5.45581 4.28906C5.01645 4.51293 4.64872 4.85345 4.39233 5.27149L4.28979 5.45508C4.16388 5.7022 4.08381 6.01663 4.04175 6.53125C3.99906 7.05373 3.99878 7.7226 3.99878 8.66699V11.333C3.99878 12.2774 3.99906 12.9463 4.04175 13.4688C4.08381 13.9833 4.16389 14.2978 4.28979 14.5449L4.39233 14.7285C4.64871 15.1465 5.01648 15.4871 5.45581 15.7109L5.65601 15.7969C5.87276 15.8743 6.14614 15.9265 6.53198 15.958C7.05439 16.0007 7.72256 16.002 8.66675 16.002H11.3337C12.2779 16.002 12.9461 16.0007 13.4685 15.958C13.9829 15.916 14.2976 15.8367 14.5447 15.7109L14.7292 15.6074C15.147 15.3511 15.4879 14.9841 15.7117 14.5449L15.7976 14.3447C15.8751 14.128 15.9272 13.8546 15.9587 13.4688C16.0014 12.9463 16.0017 12.2774 16.0017 11.333V10.833C16.0018 10.466 16.2997 10.1681 16.6667 10.168C17.0339 10.168 17.3316 10.4659 17.3318 10.833V11.333C17.3318 12.2555 17.3331 12.9879 17.2849 13.5771C17.2422 14.0993 17.1584 14.5541 16.9792 14.9717L16.8962 15.1484C16.5609 15.8066 16.0507 16.3571 15.4246 16.7412L15.1492 16.8955C14.6833 17.1329 14.1739 17.2354 13.5769 17.2842C12.9878 17.3323 12.256 17.332 11.3337 17.332H8.66675C7.74446 17.332 7.01271 17.3323 6.42358 17.2842C5.90135 17.2415 5.44665 17.1577 5.02905 16.9785L4.85229 16.8955C4.19396 16.5601 3.64271 16.0502 3.25854 15.4238L3.10425 15.1484C2.86697 14.6827 2.76534 14.1739 2.71655 13.5771C2.66841 12.9879 2.6687 12.2555 2.6687 11.333ZM13.4646 3.11328C14.4201 2.334 15.8288 2.38969 16.7195 3.28027L16.8865 3.46485C17.6141 4.35685 17.6143 5.64423 16.8865 6.53613L16.7195 6.7207L11.6726 11.7686C11.1373 12.3039 10.4624 12.6746 9.72827 12.8408L9.41089 12.8994L7.59351 13.1582C7.38637 13.1877 7.17701 13.1187 7.02905 12.9707C6.88112 12.8227 6.81199 12.6134 6.84155 12.4063L7.10132 10.5898L7.15991 10.2715C7.3262 9.53749 7.69692 8.86241 8.23218 8.32715L13.2791 3.28027L13.4646 3.11328ZM15.7791 4.2207C15.3753 3.81702 14.7366 3.79124 14.3035 4.14453L14.2195 4.2207L9.17261 9.26856C8.81541 9.62578 8.56774 10.0756 8.45679 10.5654L8.41772 10.7773L8.28296 11.7158L9.22241 11.582L9.43433 11.543C9.92426 11.432 10.3749 11.1844 10.7322 10.8271L15.7791 5.78027L15.8552 5.69629C16.185 5.29194 16.1852 4.708 15.8552 4.30371L15.7791 4.2207Z" />
              </svg>
            </button>
            <button type="button" className="rvbot-btn secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="rvbot-chatwrap">
          <div className="rvbot-thread" ref={threadRef}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`rvbot-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role === 'user' ? (
                    <div>{msg.content}</div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: formatAiText(msg.content) }} />
                  )}
                </div>
                {msg.role === 'assistant' && msg.content ? (
                  <div className="rvbot-msg-actions">
                    <button type="button" className="rvbot-action-btn" title="Copy" onClick={() => onCopyAssistant(msg.content)}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.668 10.667C12.668 9.95614 12.668 9.46258 12.6367 9.0791C12.6137 8.79732 12.5758 8.60761 12.5244 8.46387L12.4688 8.33399C12.3148 8.03193 12.0803 7.77885 11.793 7.60254L11.666 7.53125C11.508 7.45087 11.2963 7.39395 10.9209 7.36328C10.5374 7.33197 10.0439 7.33203 9.33301 7.33203H6.5C5.78896 7.33203 5.29563 7.33195 4.91211 7.36328C4.63016 7.38632 4.44065 7.42413 4.29688 7.47559L4.16699 7.53125C3.86488 7.68518 3.61186 7.9196 3.43555 8.20703L3.36524 8.33399C3.28478 8.49198 3.22795 8.70352 3.19727 9.0791C3.16595 9.46259 3.16504 9.95611 3.16504 10.667V13.5C3.16504 14.211 3.16593 14.7044 3.19727 15.0879C3.22797 15.4636 3.28473 15.675 3.36524 15.833L3.43555 15.959C3.61186 16.2466 3.86474 16.4807 4.16699 16.6348L4.29688 16.6914C4.44063 16.7428 4.63025 16.7797 4.91211 16.8027C5.29563 16.8341 5.78896 16.835 6.5 16.835H9.33301C10.0439 16.835 10.5374 16.8341 10.9209 16.8027C11.2965 16.772 11.508 16.7152 11.666 16.6348L11.793 16.5645C12.0804 16.3881 12.3148 16.1351 12.4688 15.833L12.5244 15.7031C12.5759 15.5594 12.6137 15.3698 12.6367 15.0879C12.6681 14.7044 12.668 14.211 12.668 13.5V10.667ZM13.998 12.665C14.4528 12.6634 14.8011 12.6602 15.0879 12.6367C15.4635 12.606 15.675 12.5492 15.833 12.4688L15.959 12.3975C16.2466 12.2211 16.4808 11.9682 16.6348 11.666L16.6914 11.5361C16.7428 11.3924 16.7797 11.2026 16.8027 10.9209C16.8341 10.5374 16.835 10.0439 16.835 9.33301V6.5C16.835 5.78896 16.8341 5.29563 16.8027 4.91211C16.7797 4.63025 16.7428 4.44063 16.6914 4.29688L16.6348 4.16699C16.4807 3.86474 16.2466 3.61186 15.959 3.43555L15.833 3.36524C15.675 3.28473 15.4636 3.22797 15.0879 3.19727C14.7044 3.16593 14.211 3.16504 13.5 3.16504H10.667C9.9561 3.16504 9.46259 3.16595 9.0791 3.19727C8.79739 3.22028 8.6076 3.2572 8.46387 3.30859L8.33399 3.36524C8.03176 3.51923 7.77886 3.75343 7.60254 4.04102L7.53125 4.16699C7.4508 4.32498 7.39397 4.53655 7.36328 4.91211C7.33985 5.19893 7.33562 5.54719 7.33399 6.00195H9.33301C10.022 6.00195 10.5791 6.00131 11.0293 6.03809C11.4873 6.07551 11.8937 6.15471 12.2705 6.34668L12.4883 6.46875C12.984 6.7728 13.3878 7.20854 13.6533 7.72949L13.7197 7.87207C13.8642 8.20859 13.9292 8.56974 13.9619 8.9707C13.9987 9.42092 13.998 9.97799 13.998 10.667V12.665ZM18.165 9.33301C18.165 10.022 18.1657 10.5791 18.1289 11.0293C18.0961 11.4302 18.0311 11.7914 17.8867 12.1279L17.8203 12.2705C17.5549 12.7914 17.1509 13.2272 16.6553 13.5313L16.4365 13.6533C16.0599 13.8452 15.6541 13.9245 15.1963 13.9619C14.8593 13.9895 14.4624 13.9935 13.9951 13.9951C13.9935 14.4624 13.9895 14.8593 13.9619 15.1963C13.9292 15.597 13.864 15.9576 13.7197 16.2939L13.6533 16.4365C13.3878 16.9576 12.9841 17.3941 12.4883 17.6982L12.2705 17.8203C11.8937 18.0123 11.4873 18.0915 11.0293 18.1289C10.5791 18.1657 10.022 18.165 9.33301 18.165H6.5C5.81091 18.165 5.25395 18.1657 4.80371 18.1289C4.40306 18.0962 4.04235 18.031 3.70606 17.8867L3.56348 17.8203C3.04244 17.5548 2.60585 17.151 2.30176 16.6553L2.17969 16.4365C1.98788 16.0599 1.90851 15.6541 1.87109 15.1963C1.83431 14.746 1.83496 14.1891 1.83496 13.5V10.667C1.83496 9.978 1.83432 9.42091 1.87109 8.9707C1.90851 8.5127 1.98772 8.10625 2.17969 7.72949L2.30176 7.51172C2.60586 7.0159 3.04236 6.6122 3.56348 6.34668L3.70606 6.28027C4.04237 6.136 4.40303 6.07083 4.80371 6.03809C5.14051 6.01057 5.53708 6.00551 6.00391 6.00391C6.00551 5.53708 6.01057 5.14051 6.03809 4.80371C6.0755 4.34588 6.15483 3.94012 6.34668 3.56348L6.46875 3.34473C6.77282 2.84912 7.20856 2.44514 7.72949 2.17969L7.87207 2.11328C8.20855 1.96886 8.56979 1.90385 8.9707 1.87109C9.42091 1.83432 9.978 1.83496 10.667 1.83496H13.5C14.1891 1.83496 14.746 1.83431 15.1963 1.87109C15.6541 1.90851 16.0599 1.98788 16.4365 2.17969L16.6553 2.30176C17.151 2.60585 17.5548 3.04244 17.8203 3.56348L17.8867 3.70606C18.031 4.04235 18.0962 4.40306 18.1289 4.80371C18.1657 5.25395 18.165 5.81091 18.165 6.5V9.33301Z" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {typing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div className="rvbot-typing">
                  <div className="rvbot-typing-circle" />
                </div>
              </div>
            ) : null}
          </div>

          {showWelcome ? (
            <div className="rvbot-welcome-screen" id="rvbot-welcome-screen">
              <div className="rvbot-welcome-content">
                <div className="rvbot-avatar-container">
                  <div className="rvbot-genie-banner">Journey Genie</div>
                  <div className="rvbot-avatar">
                    {logoUrl ? <img id="rvbot-welcome-logo" alt="Journey Genie" src={logoUrl} /> : null}
                  </div>
                </div>
                <h1 className="rvbot-welcome-title">Rv Journey Genie</h1>
                <p className="rvbot-tagline">We answer your tough RV repair questions! like having an RV tech in your back pocket</p>
                <div className="rvbot-suggested-questions">
                  {WELCOME_SUGGESTIONS.map(({ q }) => (
                    <button
                      key={q}
                      type="button"
                      className="rvbot-suggest-btn"
                      onClick={() => sendMessage(undefined, q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <form className="rvbot-inputbar" autoComplete="off" onSubmit={sendMessage}>
            <button type="button" className="rvbot-plus-btn" aria-label="Add" tabIndex={-1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <input
              type="text"
              className="rvbot-input"
              name="rvbot_message"
              placeholder="Ask anything"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              autoComplete="off"
            />
            <button type="button" className="rvbot-voice-btn" aria-label="Voice input" tabIndex={-1}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
            </button>
            <button type="submit" className="rvbot-send" aria-label="Send" disabled={!input.trim() || streaming}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div
        className="rvbot-overlay"
        id="rvbot-overlay"
        style={{ display: mobileOpen ? 'block' : 'none' }}
        role="presentation"
        onClick={() => setMobileOpen(false)}
      />

      {deleteTarget ? (
        <div className="rvbot-delete-modal-overlay" id="deleteModal" role="dialog" aria-modal="true">
          <div className="rvbot-delete-modal">
            <div className="rvbot-delete-modal-header">
              <h3>🗑️ Delete Chat Session</h3>
              <button type="button" className="rvbot-delete-modal-close" onClick={() => setDeleteTarget(null)}>&times;</button>
            </div>
            <div className="rvbot-delete-modal-body">
              <p>Are you sure you want to delete this chat session?</p>
              <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>This action cannot be undone.</p>
            </div>
            <div className="rvbot-delete-modal-footer">
              <button type="button" className="rvbot-delete-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="rvbot-delete-btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}

      {techModalOpen ? (
        <div className="rvbot-modal" id="tech-call-modal" style={{ display: 'flex' }}>
          <div className="rvbot-modal-content small">
            <div className="rvbot-modal-header">
              <h2>Request Tech Call</h2>
              <p id="tech-call-modal-desc">{`Each call is up to ${techMins} minutes. Contact us to schedule.`}</p>
            </div>
            <div className="rvbot-tech-call-body">
              <p className="rvbot-tech-call-info">Your plan includes tech call support. Reach out to schedule your call.</p>
              <p className="rvbot-tech-call-contact">
                Contact us to schedule:{' '}
                <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </p>
            </div>
            <button type="button" className="rvbot-btn rvbot-modal-close-btn" id="tech-call-modal-close" onClick={() => setTechModalOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
