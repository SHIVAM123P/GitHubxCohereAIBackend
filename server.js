const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// User Count Schema
const UserCountSchema = new mongoose.Schema({
  count: { type: Number, default: 0 }
});

const UserCount = mongoose.model('UserCount', UserCountSchema);

// Leaderboard Schema
const LeaderboardSchema = new mongoose.Schema({
  topContributions: {
    username: String,
    contributions: Number
  },
  topFollowers: {
    username: String,
    followers: Number
  }
});

const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);

// Get user count endpoint
app.get('/api/user-count', async (req, res) => {
  try {
    let userCount = await UserCount.findOne();
    if (!userCount) {
      userCount = new UserCount({ count: 0 });
      await userCount.save();
    }
    res.json({ totalUsers: userCount.count });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user count' });
  }
});

// Increment user count endpoint
app.post('/api/increment-user', async (req, res) => {
  try {
    let userCount = await UserCount.findOne();
    if (!userCount) {
      userCount = new UserCount({ count: 1 });
    } else {
      userCount.count += 1;
    }
    await userCount.save();
    res.json({ totalUsers: userCount.count });
  } catch (error) {
    res.status(500).json({ error: 'Error incrementing user count' });
  }
});

// Get leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findOne();
    res.json(leaderboard || {
      topContributions: { username: 'N/A', contributions: 0 },
      topFollowers: { username: 'N/A', followers: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// Update leaderboard endpoint
app.post('/api/update-leaderboard', async (req, res) => {
  try {
    const { username, contributions, followers } = req.body;
    console.log('in update leaderbo', req.body);
    let leaderboard = await Leaderboard.findOne();
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        topContributions: { username, contributions },
        topFollowers: { username, followers }
      });
    } else {
      if (contributions > leaderboard.topContributions.contributions) {
        leaderboard.topContributions = { username, contributions };
      }
      if (followers > leaderboard.topFollowers.followers) {
        leaderboard.topFollowers = { username, followers };
      }
    }

    await leaderboard.save();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Error updating leaderboard' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Debug: Log environment variables
// console.log('COHERE_API_KEY:', process.env.CO_API_KEY);
// console.log('GITHUB_TOKEN:', process.env.GITHUB_TOKEN);
// let lastCallTime = 0;
// const CALL_INTERVAL = 1000; // Set to 1 second or whatever interval you prefer
// Initialize the Cohere client
// const cohere = new CohereClient({ 
//   apiKey: process.env.CO_API_KEY 
// });

// app.post('/analyze', async (req, res) => {
//   const currentTime = Date.now();
//   // if (currentTime - lastCallTime < CALL_INTERVAL) {
//   //   return res.status(429).json({ error: 'Too many requests, please try again later.' });
//   // }
//   lastCallTime = currentTime;
//   console.log('Request body:', req.body.issues);
//   const { skills, repoFullName, issues } = req.body;
//  // Check if issues are being sent correctly
//  if (!issues || issues.length === 0) {
//   console.error('No issues found in request body');
// }
//   try {
//     // Check if Cohere API key is available
//     if (!process.env.CO_API_KEY) {
//       throw new Error('Cohere API key is not set');
//     }

//     // Classify each issue
//     const classifiedIssues = await Promise.all(issues.map(async (issue) => {
//       const responseAI = await cohere.classify({
//         model: 'large',
//         inputs: [issue.title + ". " + issue.body],
//         examples: [
//           { text: "Fix typo in README", label: "beginner" },
//           { text: "Update dependencies to latest versions", label: "intermediate" },
//           { text: "Implement new feature with complex algorithm", label: "advanced" },
//           { text: "Add unit tests for existing code", label: "beginner" },
//           { text: "Refactor code to improve performance", label: "intermediate" },
//           { text: "Design a new architecture for the application", label: "advanced" },
//           { text: "Document API endpoints", label: "beginner" },
//           { text: "Migrate database to a new system", label: "intermediate" },
//           { text: "Optimize algorithms for large data sets", label: "advanced" }
//         ]
        
//       });

//       return {
//         ...issue,
//         difficulty: responseAI.classifications[0].prediction
//       };
//     }));

//     res.json({
//       classifiedIssues: classifiedIssues,
//       delayed: false // Add a flag for success
//     });
//   } catch (err) {
//     console.error('Error:', err.message);
//     res.status(500).json({ error: 'AI on Work... Have patience please!', message: err.message });
//   }
// });

