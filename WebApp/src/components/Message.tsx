import React from "react";

interface MessageProps {
  text: string;
  sender: "user" | "bot";
}

const Message: React.FC<MessageProps> = ({ text, sender }) => {
  const isUser = sender === "user";
  // ChatGPT-like styling
  const messageClass = isUser
    ? "bg-white text-gray-900 self-end border border-gray-200" // User message style
    : "bg-gray-100 text-gray-900 self-start border border-gray-200"; // Bot message style

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`p-3 rounded-lg max-w-xl ${messageClass}`}>
        {/* Simple text display for now. Could add markdown support later. */}
        {text}
      </div>
    </div>
  );
};

export default Message;
