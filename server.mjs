import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';
dotenv.config();
// Debug: Log environment variables
console.log('COHERE_API_KEY:', process.env.CO_API_KEY);
console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN);
let lastCallTime = 0;
const CALL_INTERVAL = 1000; // Set to 1 second or whatever interval you prefer

const app = express();
app.use(cors());
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ;

// Initialize the Cohere client
const cohere = new CohereClient({ 
  apiKey: process.env.CO_API_KEY 
});

app.post('/analyze', async (req, res) => {
  const currentTime = Date.now();
  if (currentTime - lastCallTime < CALL_INTERVAL) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  lastCallTime = currentTime;
  console.log('Request body:', req.body.issues);
  const { skills, repoFullName, issues } = req.body;
 // Check if issues are being sent correctly
 if (!issues || issues.length === 0) {
  console.error('No issues found in request body');
}
  try {
    // Check if Cohere API key is available
    if (!process.env.CO_API_KEY) {
      throw new Error('Cohere API key is not set');
    }

    // Classify each issue
    const classifiedIssues = await Promise.all(issues.map(async (issue) => {
      const responseAI = await cohere.classify({
        model: 'large',
        inputs: [issue.title + ". " + issue.body],
        examples: [
          { text: "Fix typo in README", label: "beginner" },
          { text: "Update dependencies to latest versions", label: "intermediate" },
          { text: "Implement new feature with complex algorithm", label: "advanced" },
          { text: "Add unit tests for existing code", label: "beginner" },
          { text: "Refactor code to improve performance", label: "intermediate" },
          { text: "Design a new architecture for the application", label: "advanced" },
          { text: "Document API endpoints", label: "beginner" },
          { text: "Migrate database to a new system", label: "intermediate" },
          { text: "Optimize algorithms for large data sets", label: "advanced" }
        ]
        
      });

      return {
        ...issue,
        difficulty: responseAI.classifications[0].prediction
      };
    }));

    res.json({
      classifiedIssues: classifiedIssues,
    });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to analyze data with AI', message: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});