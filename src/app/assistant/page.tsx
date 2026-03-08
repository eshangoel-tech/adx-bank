"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/services/api";

interface RedirectAction {
  name: string;
  label: string;
  url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: RedirectAction[];
}

function AssistantChat() {
  const router = useRouter();
  const [chatSessId, setChatSessId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const stoppedRef = useRef(false);

  // Start session on mount
  useEffect(() => {
    let sessId = "";
    const start = async () => {
      try {
        const res = await api.post("/ai/assistant/start");
        sessId = res.data.data.chat_sess_id;
        setChatSessId(sessId);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            text: "Hello! I'm your ADX Bank assistant. How can I help you today?",
            actions: [],
          },
        ]);
      } catch (err) {
        setError("Could not start assistant: " + getErrorMessage(err));
      } finally {
        setStarting(false);
      }
    };
    start();

    // Stop session on unmount
    return () => {
      if (sessId && !stoppedRef.current) {
        stoppedRef.current = true;
        api.post("/ai/assistant/stop", { chat_sess_id: sessId }).catch(() => {});
      }
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const stopSession = useCallback(async () => {
    if (!chatSessId || stoppedRef.current) return;
    stoppedRef.current = true;
    try {
      await api.post("/ai/assistant/stop", { chat_sess_id: chatSessId });
    } catch {}
    router.push("/dashboard");
  }, [chatSessId, router]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !chatSessId || loading) return;

    setInput("");
    setError("");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post("/ai/assistant/chat", {
        chat_sess_id: chatSessId,
        message: text,
      });
      const { response, actions } = res.data.data;
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: response,
        actions: actions ?? [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (starting) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Starting assistant…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">ADX Assistant</h1>
          <p className="text-xs text-gray-500">Powered by AI · Your personal banking guide</p>
        </div>
        <button
          onClick={stopSession}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
              {/* Avatar + bubble */}
              <div className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    A
                  </div>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {/* Action buttons */}
              {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-9">
                  {msg.actions.map((action) => (
                    <button
                      key={action.name}
                      onClick={() => router.push(action.url)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      {action.label} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                A
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 mb-2 text-center">{error}</p>
      )}

      {/* Input */}
      <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your account…"
          disabled={loading}
          className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
          aria-label="Send"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-2">
        ADX Bank Assistant · Demo mode · Not financial advice
      </p>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <ProtectedRoute>
      <AssistantChat />
    </ProtectedRoute>
  );
}
