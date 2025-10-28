import React, { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { SiOpenai } from "react-icons/si";
import { BACKEND_API } from "../Backend_API.js";

const AiAssistant = ({ dp, ToName = "Gimmy", state = "Online" }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef(null);
  const messageInputRef = useRef(null);

  const sendAIMessage = async (userMessage) => {
    const updatedMessages = [
      ...messages,
      { sender: "You", message: userMessage }
    ];
  
    const res = await fetch(`${BACKEND_API}/api/v1/users/chat_Ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages:updatedMessages }),
    });
  
    const data = await res.json();
    const aiReply = data.data || "No response";
  
    setMessages((prev) => [
      ...prev,
      { sender: "You", message: userMessage },
      { sender: "AI", message: aiReply },
    ]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    sendAIMessage(message.trim());
    setMessage("");
  };

  useEffect(() => {
    chatContainerRef.current?.scrollTo(
      0,
      chatContainerRef.current.scrollHeight
    );
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-200">
        <div className="flex items-center gap-4">
          <img src={dp} alt="" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <SiOpenai /> {ToName}
            </h2>
            <p className="text-sm text-gray-600">{state}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-white space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
            <div className="bg-black text-white px-4 py-2 rounded-lg max-w-[70%] whitespace-pre-wrap">
              <strong>{msg.sender}: </strong> {msg.message}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 bg-white border-t flex items-center">
        <textarea
          ref={messageInputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your question..."
          className="w-full px-3 py-2 border rounded-lg resize-none max-h-52"
          rows={1}
          style={{ minHeight: "40px" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="ml-2 p-2 rounded-full hover:bg-gray-200 transition"
        >
          <FiSend size={24} />
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;