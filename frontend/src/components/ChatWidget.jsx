import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Merhaba! CoopLink takas ağına hoş geldiniz. Size nasıl yardımcı olabilirim?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hazır Mesaj Seçenekleri
  const quickReplies = [
    "Hesabım",
    "Destek Taleplerim",
    "Telegram Botu Linki",
    "Şikayet"
  ];

  // Fonksiyon artık hem inputtan gelen hem de butondan gelen metni alabiliyor
  const sendMessage = async (textToProcess = null) => {
    // Eğer butona tıklandıysa textToProcess dolu gelir, yoksa input alanındaki metni alır
    const userMsg = (typeof textToProcess === 'string' ? textToProcess : input).trim();
    if (!userMsg) return;

    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.reply || "Cevap alınamadı.", isBot: true }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Bağlantı hatası oluştu. Sunucu kapalı olabilir.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Penceresi */}
      {isOpen && (
        <div className="bg-white border border-[#dfe8df] rounded-2xl shadow-2xl w-80 h-[450px] flex flex-col mb-4 overflow-hidden transition-all duration-300">
          <div className="bg-leaf text-white p-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <h3 className="font-semibold text-sm">Yeşil Asistan (AI)</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`p-3 rounded-xl max-w-[85%] text-sm shadow-sm ${msg.isBot ? 'bg-white border border-[#dfe8df] self-start text-gray-700' : 'bg-leaf text-white self-end'}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-500 self-start animate-pulse">Asistan düşünüyor...</div>}
          </div>

          {/* 🌟 Hazır Mesaj Butonları (Quick Replies) */}
          <div className="p-3 bg-white border-t border-b border-[#dfe8df] flex flex-wrap gap-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(reply)}
                disabled={isLoading}
                className="text-xs bg-white border border-leaf text-leaf px-3 py-1.5 rounded-full hover:bg-leaf hover:text-white disabled:opacity-50 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="p-3 bg-gray-50 flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf transition-shadow"
              placeholder="Mesajınızı yazın..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
              onClick={() => sendMessage()} 
              disabled={isLoading || !input.trim()} 
              className="bg-leaf text-white p-2 rounded-lg hover:bg-leaf/90 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Sağ Alttaki Süzülen (Floating) Buton */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-leaf text-white p-4 rounded-full shadow-xl hover:bg-leaf/90 hover:scale-105 transition-all flex items-center justify-center animate-bounce"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}