// server.js - Simple Express server to serve the application

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Import the interface
const { processUserMessage } = require('./interface.js');

// API endpoint to process messages
app.post('/api/message', express.json(), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Process the message
    const result = await processUserMessage(message);
    res.json(result);
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ 
      error: "Error processing message", 
      message: error.message 
    });
  }
});

// Auto-load demo plan endpoint
app.get('/api/demo', async (req, res) => {
  try {
    // Generate a demo plan
    const result = await processUserMessage("plan berkeley eecs");
    res.json(result);
  } catch (error) {
    console.error("Error generating demo plan:", error);
    res.status(500).json({ 
      error: "Error generating demo plan", 
      message: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port} in your browser`);
});
