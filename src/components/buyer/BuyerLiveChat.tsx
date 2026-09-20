import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, GoogleUser } from "../../types";
import { fetchChatMessages, sendChatMessage, markChatAsRead } from "../../services/api";
import {
  MessageSquare,
  Send,
  X,
  Store,
  CheckCheck,
  Check,
  Minimize2,
  Sparkles,
  HelpCircle,
  Receipt,
  UtensilsCrossed,
} from "lucide-react";

interface BuyerLiveChatProps {
  buyerUser: GoogleUser;
  activeOrderNumber?: string;
  externalChatMessages?: ChatMessage[];
}

export const BuyerLiveChat: React.FC<BuyerLiveChatProps> = ({
  buyerUser,
  activeOrderNumber,
  externalChatMessages,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quick prompt recommendations for fast customer interaction
  const quickPrompts = [
    { label: "Cek Status Pesanan", text: "Halo Kasir, apakah pesanan saya sudah mulai diproses?" },
    { label: "Konfirmasi QRIS", text: "Halo kak, saya sudah transfer via QRIS dan upload struk ya." },
    { label: "Request Sambal", text: "Bisa tolong sambal dan bumbunya dipisah ya kak?" },
    { label: "Alat Makan", text: "Tolong sertakan sendok & tisu ya, terima kasih!" },
  ];

  // Load messages on mount or when user changes
  useEffect(() => {
    loadChat();
  }, [buyerUser.googleId]);

  // Sync with external messages from SSE in App.tsx
  useEffect(() => {
    if (externalChatMessages && externalChatMessages.length > 0) {
      const filtered = externalChatMessages.filter(
        (m) => m.customerId === buyerUser.googleId || m.customerId === "all"
      );
      setMessages(filtered);

      if (!isOpen) {
        const unread = filtered.filter((m) => m.sender === "cashier" && !m.isRead).length;
        setUnreadCount(unread);
      }
    }
  }, [externalChatMessages, buyerUser.googleId, isOpen]);

  const loadChat = async () => {
    try {
      const data = await fetchChatMessages(buyerUser.googleId);
      setMessages(data);
      const unread = data.filter((m) => m.sender === "cashier" && !m.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Gagal memuat pesan live chat:", err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    markChatAsRead(buyerUser.googleId, "buyer");
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      const newMsg = await sendChatMessage({
        sender: "buyer",
        customerId: buyerUser.googleId,
        customerName: buyerUser.name,
        customerEmail: buyerUser.email,
        customerAvatar: buyerUser.avatarUrl,
        message: text,
        orderNumber: activeOrderNumber,
      });

      if (newMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error("Gagal mengirim pesan chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Floating Chat Button (Bottom-Right) */}
      {!isOpen && (
        <button
          id="open-buyer-live-chat-btn"
          onClick={handleOpen}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3.5 shadow-xl hover:shadow-2xl flex items-center gap-2.5 transition-all active:scale-95 group border-2 border-white"
          aria-label="Buka Live Chat dengan Kasir"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-300 rounded-full border border-white" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-tight">Live Chat Kasir</span>
            <span className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              Online Sekarang
            </span>
          </div>
        </button>
      )}

      {/* Live Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex items-end sm:items-center justify-center p-0 sm:p-0">
          {/* Backdrop on mobile */}
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs sm:hidden"
          />

          <div className="relative w-full sm:w-[380px] h-[88vh] sm:h-[540px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 z-10">
            {/* Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight text-white">Kasir Toko</h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                      Official
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Respon cepat • Kasir Siaga
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Tutup Chat"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active order chip banner if any */}
            {activeOrderNumber && (
              <div className="bg-emerald-50 border-b border-emerald-100 px-3.5 py-2 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Pesanan Terakhir: <b className="font-mono">{activeOrderNumber}</b>
                </span>
                <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                  Tersambung
                </span>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60">
              {/* Info greeting */}
              <div className="text-center py-2">
                <div className="inline-block bg-slate-200/80 text-slate-600 text-[10px] px-3 py-1 rounded-full">
                  Pesan Anda terhubung langsung ke terminal Kasir
                </div>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender === "buyer";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[85%]">
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                          isMe
                            ? "bg-emerald-600 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[10px] font-bold text-emerald-700 mb-0.5 flex items-center gap-1">
                            <span>{msg.customerName || "Kasir Toko"}</span>
                          </div>
                        )}
                        <p>{msg.message}</p>
                        <div
                          className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                            isMe ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-emerald-200" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-300" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="px-3 pt-2 pb-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" /> Cepat:
              </span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.text)}
                  className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 text-[11px] rounded-full transition-colors shrink-0"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                id="buyer-chat-input"
                type="text"
                placeholder="Ketik pesan untuk kasir..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                id="buyer-send-chat-btn"
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`p-2.5 rounded-xl font-bold transition-all ${
                  !inputText.trim() || isSending
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
                }`}
                title="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
