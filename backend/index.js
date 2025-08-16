//REQUIRED PACKAGES
const express = require('express');
const cors = require('cors');
require('dotenv').config();

//Other File Dependencies
const {connectDB} = require("./db.js");
const newsRoutes = require("./routes/news");
const debateRoutes = require("./routes/debates.js")
const sessionRoutes = require("./routes/sessions");
//PORTS and MONGO URI
const PORT = Number(process.env.PORT) || 5050;
const MONGO_URL = process.env.MONGO_URL;

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/news", newsRoutes);
app.use("/api/debates", debateRoutes);
app.use("/api/sessions", sessionRoutes);

//Text to see if the back is running
app.get('/', (req, res)=>{ res.send("Backend is running🚀") });

connectDB(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Listening to PORT ${PORT}`)))
  .catch((e) => {
    console.error("Mongo connect failed:", e.message);
    process.exit(1);
  });
