import mongoose from "mongoose";

export const db = (url) => {
  return mongoose
    .connect(url)
    .then((result) => {
      console.log("MONGODB CONNECTED SUCCESSFULLY");
    })
    .catch((err) => {
      console.error("ERROR CONNECTING MONGODB:", err);
      throw err;
    });
};
