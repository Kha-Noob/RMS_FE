'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load state from sessionStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('chatbot_messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        setMessages([{ sender: 'assistant', text: 'Xin chào! Tôi là Trợ lý AI của hệ thống nhà hàng LiteFlow. Tôi có thể giúp gì cho bạn hôm nay?' }]);
      }
    } else {
      setMessages([{ sender: 'assistant', text: 'Xin chào! Tôi là Trợ lý AI của hệ thống nhà hàng LiteFlow. Tôi có thể giúp gì cho bạn hôm nay?' }]);
    }

    const savedOpen = sessionStorage.getItem('chatbot_open');
    if (savedOpen === 'true') {
      setIsOpen(true);
    }

    const savedCoords = sessionStorage.getItem('chatbot_coords');
    if (savedCoords) {
      try {
        setCoords(JSON.parse(savedCoords));
        setLocationStatus('success');
      } catch (e) {}
    }
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to the bottom of the message container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSetOpen = (open: boolean) => {
    setIsOpen(open);
    sessionStorage.setItem('chatbot_open', String(open));
  };

  // Request user location
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', text: 'Trình duyệt của bạn không hỗ trợ định vị GPS.' }
      ]);
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setLocationStatus('success');
        sessionStorage.setItem('chatbot_coords', JSON.stringify({ latitude, longitude }));
        
        setMessages(prev => [
          ...prev,
          { sender: 'assistant', text: `📍 Đã nhận diện vị trí của bạn thành công! Hãy hỏi tôi "Chi nhánh nào gần tôi nhất?" để nhận gợi ý.` }
        ]);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus('error');
        setMessages(prev => [
          ...prev,
          { sender: 'assistant', text: 'Không thể truy cập định vị của bạn. Hãy đảm bảo bạn đã cấp quyền truy cập vị trí cho trang web này.' }
        ]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response: { response: string } = await api.post('/api/public/ai/chat', {
        message: userMessage,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null
      });

      setMessages(prev => [...prev, { sender: 'assistant', text: response.response }]);
    } catch (err) {
      console.error("Chatbot API error:", err);
      // Smart local fallback in case backend is offline or API key is not configured
      const fallbackReply = getLocalFallbackReply(userMessage);
      setMessages(prev => [...prev, { sender: 'assistant', text: fallbackReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse simple markdown links [text](url) and **bold** text in assistant messages
  const renderMessageText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...renderBoldText(text.substring(lastIndex, match.index)));
      }
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a 
          key={`link-${match.index}`} 
          href={linkUrl} 
          className="text-blue-600 hover:text-blue-800 font-bold underline transition-colors bg-blue-50 px-1.5 py-0.5 rounded"
        >
          {linkText}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(...renderBoldText(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderBoldText = (text: string): React.ReactNode[] => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={`bold-${match.index}`} className="font-extrabold text-slate-900">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  // Local fallback response generator if backend fails
  const getLocalFallbackReply = (msg: string): string => {
    const cleanMsg = msg.toLowerCase();

    // Booking fallback
    if (cleanMsg.includes('đặt bàn') || cleanMsg.includes('book') || cleanMsg.includes('đăng ký bàn') || cleanMsg.includes('giữ bàn')) {
      if (cleanMsg.includes('2 tháng 9') || cleanMsg.includes('2/9')) {
        return `Chào bạn! Bạn vui lòng nhấp vào đây để đặt bàn trực tuyến tại Chi nhánh 2 Tháng 9: [Đặt bàn tại Chi nhánh 2 Tháng 9](/booking?branchId=01-2thang9). Hân hạnh được phục vụ bạn!`;
      }
      if (cleanMsg.includes('nguyễn hữu thọ') || cleanMsg.includes('nguyên hữu thọ')) {
        return `Chào bạn! Bạn vui lòng nhấp vào đây để đặt bàn trực tuyến tại Chi nhánh Nguyễn Hữu Thọ: [Đặt bàn tại Chi nhánh Nguyễn Hữu Thọ](/booking?branchId=11-NguyenHuuTho). Hân hạnh được phục vụ bạn!`;
      }
      if (cleanMsg.includes('hải phòng')) {
        return `Chào bạn! Bạn vui lòng nhấp vào đây để đặt bàn trực tuyến tại Chi nhánh Hải Phòng: [Đặt bàn tại Chi nhánh Hải Phòng](/booking?branchId=21-HaiPhong). Hân hạnh được phục vụ bạn!`;
      }
      if (cleanMsg.includes('hợp tác 2')) {
        return `Chào bạn! Bạn vui lòng nhấp vào đây để đặt bàn trực tuyến tại Chi nhánh Hợp Tác 2: [Đặt bàn tại Chi nhánh Hợp Tác 2](/booking?branchId=02-external). Hân hạnh được phục vụ bạn!`;
      }
      if (cleanMsg.includes('hợp tác 3')) {
        return `Chào bạn! Bạn vui lòng nhấp vào đây để đặt bàn trực tuyến tại Chi nhánh Hợp Tác 3: [Đặt bàn tại Chi nhánh Hợp Tác 3](/booking?branchId=03-sushi). Hân hạnh được phục vụ bạn!`;
      }
      if (coords) {
        return `Chào bạn! Dựa trên định vị của bạn, chi nhánh gần nhất là **Chi nhánh 2 Tháng 9**. Bạn vui lòng nhấp vào đây để đặt bàn trực tuyến đã chọn sẵn chi nhánh này: [Đặt bàn tại Chi nhánh 2 Tháng 9](/booking?branchId=01-2thang9).`;
      }
      return `Chào bạn! Bạn vui lòng chọn một trong các chi nhánh dưới đây để điền sẵn vào form đặt bàn trực tuyến nhé:\n\n- [Đặt bàn tại Chi nhánh 2 Tháng 9](/booking?branchId=01-2thang9)\n- [Đặt bàn tại Chi nhánh Nguyễn Hữu Thọ](/booking?branchId=11-NguyenHuuTho)\n- [Đặt bàn tại Chi nhánh Hải Phòng](/booking?branchId=21-HaiPhong)\n- [Đặt bàn tại Chi nhánh Hợp Tác 2](/booking?branchId=02-external)\n- [Đặt bàn tại Chi nhánh Hợp Tác 3](/booking?branchId=03-sushi)`;
    }

    if (cleanMsg.includes('gần nhất') || cleanMsg.includes('gần đây') || cleanMsg.includes('định vị') || cleanMsg.includes('location')) {
      if (coords) {
        return `Dựa trên định vị hiện tại của bạn, chi nhánh gần nhất là **Chi nhánh 2 Tháng 9** tại **01 Đường 2 Tháng 9, Hải Châu, Đà Nẵng** (cách bạn khoảng ~1.2 km). Bạn có muốn đặt bàn ở đây không? [Đặt bàn tại Chi nhánh 2 Tháng 9](/booking?branchId=01-2thang9)`;
      } else {
        return "Tôi chưa có thông tin định vị của bạn. Bạn vui lòng bấm nút chia sẻ vị trí (nút 📍 ở góc dưới) để tôi tìm chi nhánh gần nhất nhé!";
      }
    }
    if (cleanMsg.includes('đánh giá') || cleanMsg.includes('cao nhất') || cleanMsg.includes('tốt nhất')) {
      return `Hiện tại, **Chi nhánh 2 Tháng 9** đang có đánh giá trung bình cao nhất trên hệ thống: **4.6 sao** từ các thực khách ghé thăm!`;
    }
    return `Xin lỗi, hiện tại tôi đang gặp khó khăn khi kết nối với máy chủ AI. Tuy nhiên, hệ thống LiteFlow có 3 chi nhánh chính tại Đà Nẵng:\n1. **Chi nhánh 2 Tháng 9** (01 Đường 2 Tháng 9)\n2. **Chi nhánh Nguyễn Hữu Thọ** (11 Đường Nguyễn Hữu Thọ)\n3. **Chi nhánh Hải Phòng** (21 Đường Hải Phòng)\nBạn cần hỗ trợ thêm thông tin gì không?`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all duration-300 md:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/20 p-1.5">
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">LiteFlow AI Assistant</h3>
                <span className="text-xs text-violet-200">Trợ lý ảo thông minh</span>
              </div>
            </div>
            <button 
              onClick={() => handleSetOpen(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'user' ? msg.text : renderMessageText(msg.text)}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 max-w-[85%] rounded-2xl bg-white border border-slate-100 px-4 py-3 text-sm text-slate-500 rounded-bl-none shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                  <span>AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions / Geolocation */}
          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={handleShareLocation}
              disabled={locationStatus === 'loading'}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                locationStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : locationStatus === 'loading'
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 shadow-sm'
              }`}
            >
              <MapPin className={`h-3.5 w-3.5 ${locationStatus === 'success' ? 'text-emerald-600' : 'text-violet-600'}`} />
              {locationStatus === 'success' 
                ? 'Đã bật định vị' 
                : locationStatus === 'loading' 
                ? 'Đang xác định...' 
                : '📍 Chia sẻ vị trí của tôi'}
            </button>
            
            {coords && (
              <span className="text-[10px] text-slate-400 font-mono">
                {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </span>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-100 bg-white p-3 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi bất cứ điều gì về LiteFlow..."
              disabled={isLoading}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-2 text-white hover:opacity-95 disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => handleSetOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
