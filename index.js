import app from "./src/app.js";
import express from "express";
import { PORT } from "./config/env.config.js";
import globalError from "./src/middleware/globalError.middleware.js";
import { db } from "./connect/db.connect.js";
import { MONGODB_URL } from "./config/env.config.js";

// app.use("/", (req, res) => {
//   return res.send("HELLO");
// });

app.use(globalError);

db(MONGODB_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
