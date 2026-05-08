import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Chat() {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      setSessions(response.data);
      if (response.data.length > 0 && !currentSession) {
        loadSession(response.data[0].sessionId);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const response = await api.get(`/chat/sessions/${sessionId}`);
      setCurrentSession(sessionId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await api.post('/chat/sessions');
      setCurrentSession(response.data.sessionId);
      setMessages([]);
      loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || streaming) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to UI
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    // Create session if needed
    let sessionId = currentSession;
    if (!sessionId) {
      try {
        const response = await api.post('/chat/sessions');
        sessionId = response.data.sessionId;
        setCurrentSession(sessionId);
      } catch (error) {
        console.error('Failed to create session:', error);
        return;
      }
    }

    setStreaming(true);

    // Prepare history
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    try {
      // Use EventSource for streaming
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          history,
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              setStreaming(false);
              loadSessions(); // Refresh sessions
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                assistantMessage += parsed.chunk;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.'
      }]);
    } finally {
      setStreaming(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Chat History</h2>
          <button className="new-chat-btn" onClick={createNewSession}>
            + New Chat
          </button>
        </div>
        <div className="chat-sessions">
          {sessions.map(session => (
            <div
              key={session.sessionId}
              className={`chat-session-item ${currentSession === session.sessionId ? 'active' : ''}`}
              onClick={() => loadSession(session.sessionId)}
            >
              <div className="chat-session-title">{session.title}</div>
              <div className="chat-session-date">
                {new Date(session.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h1>RV Journey Genie</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="loading">
              Start a conversation by typing a message below.
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <form className="chat-input-form" onSubmit={sendMessage}>
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about RV maintenance..."
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!input.trim() || loading || streaming}
            >
              {streaming ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
