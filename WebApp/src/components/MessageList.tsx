import React from "react";
import Message from "./Message";

interface MessageData {
  id: number;
  text: string;
  sender: "user" | "bot";
}

interface MessageListProps {
  messages: MessageData[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex-grow p-4 overflow-y-auto">
      {messages.map((msg) =>
        msg.text === "..." && msg.sender === "bot" ? (
          // Typing indicator with pulsing animation
          <div key={msg.id} className="flex mb-4 justify-start">
            <div className="p-3 rounded-lg bg-gray-600 text-gray-100">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                  style={{ animationDelay: "600ms" }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <Message key={msg.id} text={msg.text} sender={msg.sender} />
        )
      )}
    </div>
  );
};

export default MessageList;
