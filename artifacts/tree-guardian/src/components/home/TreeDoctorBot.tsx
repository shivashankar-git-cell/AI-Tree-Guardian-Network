import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Stethoscope, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassportData } from "./TreePassport";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface TreeDoctorBotProps {
  passportData: PassportData;
}

const SUGGESTED = [
  "How often should I water this tree?",
  "What fertilizer should I use?",
  "How do I improve its health score?",
  "Is it safe to prune it now?",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Stethoscope className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-0.5">
          <Stethoscope className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mb-0.5">
          <Leaf className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-2xl rounded-bl-sm"
        }`}
        data-testid={isUser ? "msg-user" : "msg-assistant"}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

export function TreeDoctorBot({ passportData }: TreeDoctorBotProps) {
  const greeting = `Hello! I'm your Tree Doctor Bot. I'm looking at your **${passportData.species}** — health score ${passportData.healthScore}/100, with ${passportData.survivalRisk.toLowerCase()} survival risk. Ask me anything about its care!`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset chat when passport data changes (new tree analyzed)
  useEffect(() => {
    setMessages([{ id: "welcome", role: "assistant", content: greeting }]);
  }, [passportData.treeId]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages.slice(1).map((m) => ({ role: m.role, content: m.content })),
          passportData: {
            species: passportData.species,
            healthScore: passportData.healthScore,
            possibleIssue: passportData.possibleIssue,
            recommendation: passportData.recommendation,
            survivalRisk: passportData.survivalRisk,
          },
        }),
      });

      const data = (await response.json()) as { reply: string };
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I couldn't connect right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col h-full min-h-[540px] rounded-2xl border-2 border-primary/20 shadow-2xl bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="bg-primary/5 border-b border-primary/10 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-serif font-bold text-foreground text-lg leading-tight">Tree Doctor Bot</p>
          <p className="text-xs text-muted-foreground leading-tight">
            Expert arborist AI · {passportData.treeId}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scroll-smooth" data-testid="chat-messages">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-3 flex flex-wrap gap-2"
          >
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs bg-primary/8 hover:bg-primary/15 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                data-testid="btn-suggested-question"
              >
                {q}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-background/50">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your tree's care…"
          disabled={isTyping}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          data-testid="input-chat-message"
        />
        <Button
          size="icon"
          onClick={() => sendMessage(input)}
          disabled={isTyping || !input.trim()}
          className="rounded-full w-9 h-9 shrink-0"
          data-testid="button-send-chat"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
