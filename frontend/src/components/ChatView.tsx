import { useRef, useEffect, useState } from 'react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  finalAnswer: string;
  isValid: boolean;
  queryType: string | null;
  error: string | null;
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const res = await api.post<ChatResponse>('/chat', { message: trimmed });
      const { finalAnswer, error: apiError } = res.data;

      if (apiError) {
        setError(apiError);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${apiError}` },
        ]);
      } else {
        setError(null);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: finalAnswer || 'No response.' },
        ]);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            (err as { message?: string }).message
          : String(err);
      const errMsg = msg ?? 'Request failed';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = input.trim().length > 0 && !loading;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        minHeight: 400,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: '#fafafa',
          borderRadius: 8,
          marginBottom: '1rem',
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>
            Ask a question about your data. Try "What are the unpaid invoices?" or "Show orders
            not billed."
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                background: m.role === 'user' ? '#333' : '#fff',
                color: m.role === 'user' ? '#fff' : '#333',
                border: m.role === 'assistant' ? '1px solid #ddd' : undefined,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {m.content.startsWith('Error:') ? (
                <span style={{ color: '#c00' }}>{m.content}</span>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #ddd',
                color: '#666',
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div
          style={{
            padding: '0.5rem 1rem',
            background: '#fee',
            color: '#c00',
            borderRadius: 6,
            marginBottom: '0.5rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={loading}
          rows={2}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #ccc',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'none',
            opacity: loading ? 0.7 : 1,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: '0.75rem 1.5rem',
            background: canSubmit ? '#333' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontWeight: 500,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
