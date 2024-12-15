const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
// CORS configuration with specific origin
const allowedOrigins = [
  "http://localhost:3000",
  "https://git-statss.netlify.app"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));
// User Count Schema
const UserCountSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
});

const UserCount = mongoose.model("UserCount", UserCountSchema);

// Leaderboard Schema
const LeaderboardSchema = new mongoose.Schema({
  topContributors: [
    {
      avatar_url: String,
      username: String,
      contributions: Number,
    },
  ],
});

const Leaderboard = mongoose.model("Leaderboard", LeaderboardSchema);


// New GitHub User Schema
// New GitHub User Schema
const GitHubUserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true }, // Required field
  contributions: { type: Number, default: 0 }, // Optional
  streak: { type: Number, default: 0 }, // Optional
  openSourceContributions: { type: Number, default: 0 }, // Optional
  joinedDate: { type: Date }, // Optional
  followers: { type: Number, default: 0 }, // Optional
  following: { type: Number, default: 0 }, // Optional
  repositories: { type: Number, default: 0 }, // Optional
  stars: { type: Number, default: 0 }, // Optional
  lastUpdated: { type: Date, default: Date.now }, // Optional
  avatar_url:
  {
      data: Buffer,
      contentType: String
  },
  html_url:{data: Buffer,
    contentType: String}
});
;

const GitHubUser = mongoose.model("GitHubUser", GitHubUserSchema);
app.get("/", (req, res) => {
  res.send("GitHubxCohereAI Backend is running");
});


// Backend: Add this to your existing schemas
const SharedBannerSchema = new mongoose.Schema({
  username: String,
  imageUrl: String,
  userData: Object,
});

const SharedBanner = mongoose.model("SharedBanner", SharedBannerSchema);


// New route to save or update GitHub user data
app.post("/api/save-github-user", async (req, res) => {
  try {
    const {
      username,
      contributions = 0, // Default to 0 if not provided
      streak = 0, // Default to 0 if not provided
      openSourceContributions = 0, // Default to 0 if not provided
      created_at, // This is still optional
      followers = 0, // Default to 0 if not provided
      following = 0, // Default to 0 if not provided
      repositories = 0, // Default to 0 if not provided
      stars = 0, // Default to 0 if not provided
      avatar_url,
      html_url
    } = req.body;

    const userData = {
      contributions,
      streak,
      openSourceContributions,
      joinedDate: created_at,
      followers,
      following,
      repositories,
      stars,
      lastUpdated: new Date(),
      avatar_url,
      html_url
    };

    const user = await GitHubUser.findOneAndUpdate(
      { username },
      userData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "GitHub user data saved successfully", user });
  } catch (error) {
    console.error("Error saving GitHub user data:", error);
    res.status(500).json({ error: "Error saving GitHub user data" });
  }
});

// New API route to get the last 5 users who interacted
app.get("/api/last-5-users", async (req, res) => {
  try {
    const users = await GitHubUser.find()
      .sort({ lastUpdated: -1 }) // Sort by latest interaction
      .limit(5); // Get the latest 5 users

    res.json(users);
  } catch (error) {
    console.error("Error fetching last 5 users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});


app.get("/api/github-user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await GitHubUser.findOne({ username });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "GitHub user not found" });
    }
  } catch (error) {
    console.error("Error fetching GitHub user data:", error);
    res.status(500).json({ error: "Error fetching GitHub user data" });
  }
});

// New route to find GitHub twin
app.get("/api/github-twin/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await GitHubUser.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const twin = await GitHubUser.findOne({
      username: { $ne: username },
      contributions: { $gte: user.contributions * 0.2, $lte: user.contributions * 3.5 },
      // followers: { $gte: user.followers * 0.5, $lte: user.followers * 1.5 },
      // following: { $gte: user.following * 0.5, $lte: user.following * 1.5 },
    }).sort({ lastUpdated: -1 });

    if (twin) {
      res.json({
        message: `Your GitHub twin is ${twin.username}! You both have around ${user.contributions} contributions.`,
        twin: twin
      });
    } else {
      res.json({ message: "No GitHub twin found at the moment." });
    }
  } catch (error) {
    console.error("Error finding GitHub twin:", error);
    res.status(500).json({ error: "Error finding GitHub twin" });
  }
});
// Update the save-shared-banner endpoint
app.post("/api/save-shared-banner", async (req, res) => {
  try {
    const { username, imageUrl, userData } = req.body;
    console.log('userdata', userData);
    let sharedBanner = await SharedBanner.findOne({ username });
    if (sharedBanner) {
      sharedBanner.imageUrl = imageUrl;
      sharedBanner.userData = userData;
    } else {
      sharedBanner = new SharedBanner({ username, imageUrl, userData });
    }
    await sharedBanner.save();
    res.json({ message: "Shared banner saved successfully" });
  } catch (error) {
    console.error("Error saving shared banner:", error);
    res.status(500).json({ error: "Error saving shared banner" });
  }
});

// Update the user retrieval endpoint
app.get("/api/user/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const sharedBanner = await SharedBanner.findOne({ username });
    if (sharedBanner) {
      res.json(sharedBanner.userData);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// New route to serve the HTML for the Twitter Card
app.get('/api/share/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { imageUrl } = req.query;

    // Fetch user data
    const userData = await fetchUserData(username);

    // Render the shared page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${username}'s GitHub Stats</title>
        <style>
          /* Add your CSS styles here */
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #f0f0f0;
          }
          .container {
            max-width: 600px;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${username}'s GitHub Stats</h1>
          <img src="${imageUrl}" alt="${username}'s GitHub Stats" />
          <p>Contributions: ${userData.contributions}</p>
          <p>Streak: ${userData.streak} days</p>
          <!-- Add more user data here -->
        </div>
        <script>
          // Service Worker Registration
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful');
              }).catch(err => {
                console.log('ServiceWorker registration failed: ', err);
              });
            });
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in /api/share:', error);
    res.status(500).send('An error occurred while fetching the shared stats. Please try again.');
  }
});

// Get user count endpoint

app.get("/api/user-count", async (req, res) => {
  try {
    let userCount = await UserCount.findOne();
    if (!userCount) {
      userCount = new UserCount({ count: 0 });
      await userCount.save();
    }
    res.json({ totalUsers: userCount.count });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user count" });
  }
});

// Increment user count endpoint
app.post("/api/increment-user", async (req, res) => {
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
    res.status(500).json({ error: "Error incrementing user count" });
  }
});

// Get leaderboard endpoint

app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findOne();
    res.json(leaderboard ? leaderboard.topContributors : []);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Error fetching leaderboard" });
  }
});


// Update leaderboard endpoint
app.post("/api/update-leaderboard", async (req, res) => {
  try {
    const {avatar_url, username, contributions } = req.body;
    console.log("data in req.body in update-leaderboard", req.body);
    let leaderboard = await Leaderboard.findOne();

    if (!leaderboard) {
      // If no leaderboard exists, create a new one
      leaderboard = new Leaderboard({
        topContributors: [{ avatar_url,username, contributions }],
      });
    } else {
      // Check if the user already exists in the leaderboard
      const existingContributorIndex = leaderboard.topContributors.findIndex(
        (contributor) => contributor.username === username
      );

      if (existingContributorIndex !== -1) {
        // Update existing contributor's contributions
        leaderboard.topContributors[existingContributorIndex].contributions =
          contributions;
      } else {
        // Add new contributor
        leaderboard.topContributors.push({ avatar_url,username, contributions });
      }

      // Sort contributors by contributions in descending order
      leaderboard.topContributors.sort((a, b) => b.contributions - a.contributions);

      // Keep only the top 5 contributors
      leaderboard.topContributors = leaderboard.topContributors.slice(0, 5);
    }

    await leaderboard.save();
    res.json(leaderboard.topContributors);
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    res.status(500).json({ error: "Error updating leaderboard" });
  }
});


// Move the 404 handler to the end
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);

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
