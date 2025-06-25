import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Bot, User, X } from "lucide-react";

// Import the types you need
interface SavedBill {
  id: string;
  name: string;
  month: string;
  year: number;
  appliances: any[];
  settings: any;
  calculation: {
    monthlyBill: number;
    yearlyBill: number;
    totalKwh: number;
    dailyAverage: number;
    applianceBreakdown: any[];
    categoryBreakdown: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface BillCalculation {
  monthlyBill: number;
  yearlyBill: number;
  totalKwh: number;
  dailyAverage: number;
  applianceBreakdown: any[];
  categoryBreakdown: any[];
}

// Define types inline
interface ChatMessage {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

interface BoltChatBotProps {
  prediction?: {
    usageLevel?: string;
    currentMonth?: number;
    potentialSavings?: number;
  };
  // Add new props for saved bills and current bill data
  savedBills?: SavedBill[];
  currentBillData?: BillCalculation | null;
  userName?: string;
}

export const BoltChatBot: React.FC<BoltChatBotProps> = ({
  prediction,
  savedBills = [],
  currentBillData,
  userName = "User",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hi! I'm your energy assistant. Ask me anything about saving power or understanding your bill.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Only show alert if prediction exists and has high usage
    if (
      prediction &&
      (prediction.usageLevel === "high" || prediction.usageLevel === "critical")
    ) {
      const alertMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `⚠️ Your usage is ${prediction.usageLevel} with a bill of $${(
          prediction.currentMonth || 0
        ).toFixed(2)}. I can help reduce it by up to $${(
          prediction.potentialSavings || 0
        ).toFixed(2)}. Want tips?`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, alertMessage]);
    }
  }, [prediction]);

  // Function to prepare context data for the chatbot
  const prepareContextData = () => {
    const context = {
      userName,
      currentBill: currentBillData
        ? {
            monthlyBill: currentBillData.monthlyBill,
            yearlyBill: currentBillData.yearlyBill,
            totalKwh: currentBillData.totalKwh,
            dailyAverage: currentBillData.dailyAverage,
            topAppliances: currentBillData.applianceBreakdown
              .slice(0, 3)
              .map((item) => ({
                name: item.appliance.name,
                monthlyCost: item.monthlyCost,
                monthlyKwh: item.monthlyKwh,
                percentage: item.percentage,
              })),
          }
        : null,
      billHistory: savedBills.map((bill) => ({
        name: bill.name,
        month: bill.month,
        year: bill.year,
        monthlyBill: bill.calculation.monthlyBill,
        totalKwh: bill.calculation.totalKwh,
        topAppliance:
          bill.calculation.applianceBreakdown[0]?.appliance.name || "Unknown",
      })),
      totalBills: savedBills.length,
      averageMonthlyBill:
        savedBills.length > 0
          ? savedBills.reduce(
              (sum, bill) => sum + bill.calculation.monthlyBill,
              0
            ) / savedBills.length
          : 0,
      prediction: prediction || null,
    };

    return context;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      console.log("Sending message:", currentMessage);

      // Prepare context data
      const contextData = prepareContextData();

      const response = await fetch(
        "https://powerbill-prediction-1.onrender.com/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentMessage,
            context: contextData, // Send context data
          }),
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Check if we have a reply
      if (data.reply) {
        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      } else if (data.error) {
        // Handle error from backend
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `⚠️ Error: ${data.error}`,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        // Unexpected response format
        console.error("Unexpected response format:", data);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "⚠️ Received unexpected response format from server.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);

      let errorText = "⚠️ Failed to connect to AI assistant.";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorText =
            "⚠️ Cannot connect to server. Make sure the backend is running on http://localhost:5000";
        } else if (error.message.includes("HTTP error")) {
          errorText = `⚠️ Server error: ${error.message}`;
        } else {
          errorText = `⚠️ Error: ${error.message}`;
        }
      }

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Test connection function
  const testConnection = async () => {
    try {
      const response = await fetch(
        "https://powerbill-prediction-1.onrender.com/api/health"
      );
      const data = await response.json();
      console.log("Health check:", data);
    } catch (error) {
      console.error("Health check failed:", error);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Energy Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.sender === "bot" && (
                      <Bot className="w-4 h-4 mt-0.5 text-blue-500" />
                    )}
                    {message.sender === "user" && (
                      <User className="w-4 h-4 mt-0.5 text-white" />
                    )}
                    <div>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user"
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm p-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about saving energy..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
