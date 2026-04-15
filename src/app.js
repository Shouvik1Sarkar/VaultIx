import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import bookMarkedRoutes from "./routes/bookMarked.routes.js";
import { db } from "../connect/db.connect.js";
import { MONGODB_URL } from "../config/env.config.js";
import userRoutes from "./routes/user.routes.js";
import folderRoutes from "./routes/folder.routes.js";
import mongoSanitize from "express-mongo-sanitize";
import arcjetMiddleware from "./middleware/arcjet.middleware.js";
import helmet from "helmet";
const app = express();

// db(MONGODB_URL);

const allowedOrigins = [
  "http://localhost:5173", // your local frontend (change port if different)
  "https://yourapp.vercel.app", // your production frontend URL
];
app.use(express.json({ limit: "10kb" }));
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // required because you use cookies (accessToken, refreshToken)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
// app.use(mongoSanitize());

// wrap this line:
// if (process.env.NODE_ENV !== "test") {
//   app.use(arcjetMiddleware);
// }

app.use("/v1/api/auth/", authRoutes);
app.use("/v1/api/bookMark/", bookMarkedRoutes);
app.use("/v1/api/user/", userRoutes);
app.use("/v1/api/folder/", folderRoutes);

export default app;
