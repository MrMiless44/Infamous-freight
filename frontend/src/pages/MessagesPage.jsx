import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { messagesApi, loadsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
  Package,
} from 'lucide-react';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const loadId = searchParams.get('load');
  const { user } = useAuth();

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!loadId || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get load info
        const loadRes = await loadsApi.get(loadId);
        setLoad(loadRes.data);

        // Get thread
        const threadRes = await messagesApi.getThreadByLoad(loadId);
        setThread(threadRes.data);
        setSummary(threadRes.data?.summary || null);

        // Get messages
        if (threadRes.data?.id) {
          const msgsRes = await messagesApi.getMessages(threadRes.data.id);
          setMessages(msgsRes.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !thread) return;

    setSending(true);
    try {
      const res = await messagesApi.send({
        thread_id: thread.id,
        body: text.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSummarize = async () => {
    if (!thread) return;
    setSummarizing(true);
    try {
      const res = await messagesApi.summarize(thread.id);
      setSummary(res.data.summary);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to summarize');
    } finally {
      setSummarizing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Sign In Required</h1>
          <p className="text-zinc-500 mb-4">Please sign in to view messages.</p>
          <Link to="/sign-in">
            <Button data-testid="messages-signin">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!loadId) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Messages</h1>
          <p className="text-zinc-500 mb-4">
            Open messages from a load detail page.
          </p>
          <Link to="/loads">
            <Button data-testid="browse-loads-btn">Browse Loads</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase mb-2">Error</h1>
          <p className="text-zinc-500 mb-4">{error}</p>
          <Link to={`/loads/${loadId}`}>
            <Button>Back to Load</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold uppercase tracking-tight">
                Messages
              </h1>
              {load && (
                <Link
                  to={`/loads/${loadId}`}
                  className="flex items-center gap-2 text-amber-500 hover:text-amber-400 mt-1"
                >
                  <Package className="h-4 w-4" />
                  <span className="font-mono text-sm">
                    {load.pickup_city}, {load.pickup_state} → {load.dropoff_city},{' '}
                    {load.dropoff_state}
                  </span>
                </Link>
              )}
            </div>
            <Button
              onClick={handleSummarize}
              variant="outline"
              className="gap-2"
              disabled={summarizing || messages.length === 0}
              data-testid="summarize-btn"
            >
              {summarizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI Summary
            </Button>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="bg-blue-950/30 border border-blue-800 rounded-sm p-4 mb-6" data-testid="thread-summary">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium uppercase tracking-wider">
                AI Summary
              </span>
            </div>
            <p className="text-zinc-300 whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {/* Messages Area */}
        <div className="bg-[#121217] border border-zinc-800 rounded-sm">
          {/* Messages List */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div
                      className={`max-w-[70%] ${isMe
                        ? 'bg-amber-500/20 border-amber-800'
                        : 'bg-zinc-800/50 border-zinc-700'
                      } border rounded-sm p-3`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3 text-zinc-500" />
                        <span className="text-xs text-zinc-400 font-medium">
                          {isMe ? 'You' : msg.sender_name || 'User'}
                        </span>
                        <span className="text-xs text-zinc-600 font-mono">
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-zinc-200">{msg.body}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 p-4 border-t border-zinc-800"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-zinc-950 border-zinc-800"
              disabled={!thread}
              data-testid="message-input"
            />
            <Button
              type="submit"
              disabled={sending || !text.trim() || !thread}
              className="gap-2"
              data-testid="send-message-btn"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
