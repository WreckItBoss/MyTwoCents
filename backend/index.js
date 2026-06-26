//REQUIRED PACKAGES
//test
const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

//Other File Dependencies
const {connectDB} = require("./db.js");
const newsRoutes = require("./routes/news");
const debateRoutes = require("./routes/debates.js");
const sessionRoutes = require("./routes/sessions");
const {webSocket} = require("./websockets/debateSockets.js");
//PORTS and MONGO URI
const PORT = Number(process.env.PORT) || 5050;
const MONGO_URL = process.env.MONGO_URL;

const app = express();

app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173", "https://my-two-cents.vercel.app"] })); // Vite default

app.use("/api/news", newsRoutes);
app.use("/api/debates", debateRoutes);
app.use("/api/sessions", sessionRoutes);

//Text to see if the back is running
app.get('/', (req, res)=>{ res.send("Backend is running🚀") });

const server = http.createServer(app);

webSocket(server)

connectDB(MONGO_URL)
  .then(() => server.listen(PORT, () => console.log(`Listening to PORT ${PORT}`)))
  .catch((e) => {
    console.error("Mongo connect failed:", e.message);
    process.exit(1);
  });
