"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatInput from "@/components/ChatInput";
import MessageList from "@/components/MessageList";

interface MessageData {
  id: number;
  text: string;
  sender: "user" | "bot";
}

export default function Home() {
  // Initialize with a welcome message
  const [messages, setMessages] = useState<MessageData[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const messageListRef = useRef<HTMLDivElement>(null);

  // API URL for the Python FastAPI backend
  const API_URL =
    process.env.API_URL || "http://localhost:8000/api/message_stream";

  // Function to handle streaming response from the Python backend API
  const fetchBotResponseStreaming = async (
    userInput: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: userInput }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Get the reader from the response body stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get reader from response");
    }

    // Read the stream
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    }
  };

  // Handle sending messages and getting responses from the API
  const handleSendMessage = async (text: string) => {
    // Add user message to the chat
    const newUserMessage: MessageData = {
      id: Date.now(),
      text,
      sender: "user",
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Create a bot message with initial empty text
    const botMessageId = Date.now() + 1;
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: botMessageId,
        text: "",
        sender: "bot",
      },
    ]);

    try {
      // Initialize accumulated response
      let accumulatedResponse = "";

      // Function to handle each chunk
      const handleChunk = (chunk: string) => {
        accumulatedResponse += chunk;

        // Update the bot message with the accumulated response
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, text: accumulatedResponse }
              : msg
          )
        );
      };

      // Fetch streaming response from the Python backend API
      await fetchBotResponseStreaming(text, handleChunk);
    } catch (_error) {
      // Update the bot message with an error
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: "Sorry, I encountered an error. Please try again later. ${_error}",
              }
            : msg
        )
      );
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header (Optional, can be removed for closer ChatGPT look) */}
      {/* <h1 className="text-center text-xl font-semibold p-4 bg-gray-900 text-gray-200 border-b border-gray-700">
        Chat
      </h1> */}

      {/* Main chat area */}
      <div className="flex-grow overflow-y-auto w-full max-w-3xl mx-auto px-4 pt-4">
        {/* Assign ref to the MessageList container */}
        <div ref={messageListRef} className="h-full">
          <MessageList messages={messages} />
        </div>
      </div>

      {/* Input area */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-4">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
