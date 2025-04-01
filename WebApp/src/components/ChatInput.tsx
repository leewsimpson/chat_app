"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    // Remove top border, adjust padding
    <form onSubmit={handleSubmit} className="pt-2">
      <div className="relative flex items-center">
        <textarea // Use textarea for potentially multiline input like ChatGPT
          rows={1} // Start with one row
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Auto-resize textarea height (basic implementation)
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            // Send message on Enter, allow Shift+Enter for newline
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Send a message..."
          className="flex-grow p-3 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none overflow-y-auto"
          style={{ maxHeight: "150px" }} // Limit max height
        />
        <button
          type="submit"
          disabled={!input.trim()} // Disable button if input is empty
          className="absolute right-2 bottom-2 p-2 bg-transparent text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
