const {connectDB} = require("./db.js");
const express = require('express');
const cors = require('cors');
require('dotenv').config;

const app = express();

app.use(express.json());
app.use(cors());

//Text to see if the back is running
app.get('/', (req, res)=>{ res.send("Backend is running🚀") });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Listening to PORT ${PORT}`))

connectDB(process.env.MONGO_URL)
  .then(() => app.listen(PORT, () => console.log(`Listening to PORT ${PORT}`)))
  .catch((e) => {
    console.error("Mongo connect failed:", e.message);
    process.exit(1);
  });
