import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.static("public"));

// Endpoint to get an ephemeral key for the realtime session
app.get("/session", async (req, res) => {
  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "verse",
      }),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});