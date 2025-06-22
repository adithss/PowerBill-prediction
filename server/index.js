import express from "express";
import cors from "cors";
import "dotenv/config";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "Message is required and must be a string",
    });
  }

  console.log("Received message:", message);

  // Try Google Gemini with updated model name
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a helpful energy assistant. Help users save money on electricity bills and provide energy-saving tips. Keep responses concise and practical.

User question: ${message}

Assistant response:`;

      // Updated to use gemini-1.5-flash (recommended for most use cases)
      // Alternative: gemini-1.5-pro for more complex tasks
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const reply = response.data.candidates[0].content.parts[0].text.trim();
      console.log("Gemini reply:", reply);
      return res.json({ reply, model: "gemini-1.5-flash" });
    } catch (error) {
      console.error("Gemini error:", error.response?.data || error.message);
      // Fall back to our energy response
    }
  }

  // Fallback with enhanced responses
  const reply = getEnergyResponse(message);
  res.json({ reply, model: "fallback" });
});

function getEnergyResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I'm your energy assistant. How can I help you save on your electricity bill today?";
  }

  if (lowerMessage.includes("save") || lowerMessage.includes("reduce")) {
    return "Here are quick energy-saving tips: Use LED bulbs, unplug devices when not in use, set AC to 78°F, and run appliances during off-peak hours. These can reduce your bill by 15-25%.";
  }

  if (lowerMessage.includes("bill") || lowerMessage.includes("cost")) {
    return "To lower your electricity bill, try: adjusting thermostat settings, using energy-efficient appliances, improving home insulation, and switching to time-of-use plans if available.";
  }

  if (lowerMessage.includes("appliance") || lowerMessage.includes("device")) {
    return "Major energy consumers are: AC/heating (40-50%), water heater (15-20%), lighting (10-15%), and electronics (5-10%). Focus on these for maximum savings.";
  }

  if (lowerMessage.includes("peak") || lowerMessage.includes("time")) {
    return "Peak hours are typically 4-9 PM weekdays. Avoid using heavy appliances during this time. Run dishwashers, washing machines, and dryers during off-peak hours to save money.";
  }

  if (lowerMessage.includes("solar") || lowerMessage.includes("renewable")) {
    return "Solar panels can reduce your bill by 70-90%. Consider factors like roof orientation, local incentives, and payback period. Many areas offer net metering for excess power.";
  }

  return "I'm here to help you save energy and reduce costs! Ask me about lowering your bill, understanding usage, optimizing appliances, or renewable energy options.";
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    gemini_configured: !!process.env.GEMINI_API_KEY,
    available_models: ["gemini-1.5-flash", "gemini-1.5-pro"],
  });
});

// New endpoint to test Gemini connection
app.get("/api/test-gemini", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: "Say hello and confirm you're working.",
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text.trim();
    res.json({ success: true, reply, model: "gemini-1.5-flash" });
  } catch (error) {
    res.status(500).json({
      error: "Gemini test failed",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🤖 Gemini configured: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/chat - Chat with energy assistant`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/test-gemini - Test Gemini connection`);
});
