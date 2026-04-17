// getMe;
import { Router } from "express";

import { logInAuth } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";
import {
  allFolders,
  createFolder,
  deleteFolder,
  renameFolder,
} from "../controllers/folder.controllers.js";
const folderRoutes = Router();

// folderRoutes.get("/randomFolder", randomFolder);
folderRoutes.post("/createFolder", logInAuth, createFolder);
folderRoutes.patch("/renameFolder/:folder", logInAuth, renameFolder);
folderRoutes.delete("/deleteFolder/:folder", logInAuth, deleteFolder);
folderRoutes.post("/allFolders", logInAuth, allFolders);

export default folderRoutes;
