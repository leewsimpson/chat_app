import dotenv from "dotenv";
import { App } from "@slack/bolt";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// API URL for the Python FastAPI backend
const API_URL = "http://localhost:8000/api/message";

// Function to fetch response from the Python backend API
async function fetchBotResponse(userInput: string): Promise<string> {
  try {
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

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Error fetching bot response:", error);
    return "Sorry, I'm having trouble connecting to my backend. Please try again later.";
  }
}

// Listens for mentions of your bot
app.event("app_mention", async ({ event, client, say }) => {
  try {
    // Get the text of the message without the bot mention
    const text = event.text.replace(/<@[A-Z0-9]+>/g, "").trim();

    // Generate a response using the Python FastAPI backend
    const response = await fetchBotResponse(text);

    // Respond to the mention
    await say(`<@${event.user}>, ${response}`);
  } catch (error) {
    console.error("Error handling app_mention event:", error);
    await say(
      `<@${event.user}>, Sorry, I encountered an error. Please try again later.`
    );
  }
});

// Start the app
(async () => {
  try {
    // Start your app
    await app.start(process.env.PORT ? parseInt(process.env.PORT) : 3000);
    console.log("⚡️ Bolt app is running!");
  } catch (error) {
    console.error("Error starting app:", error);
  }
})();
