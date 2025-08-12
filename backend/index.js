//REQUIRED PACKAGES
const express = require('express');
const cors = require('cors');
require('dotenv').config();

//Other File Dependencies
const {connectDB} = require("./db.js");
const newsRoutes = require("./routes/news");
//PORTS and MONGO URI
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URL = process.env.MONGO_URL;

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/news", newsRoutes);

//Text to see if the back is running
app.get('/', (req, res)=>{ res.send("Backend is running🚀") });

connectDB(MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Listening to PORT ${PORT}`)))
  .catch((e) => {
    console.error("Mongo connect failed:", e.message);
    process.exit(1);
  });
