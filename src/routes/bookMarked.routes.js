import { Router } from "express";
import {
  all_the_saved_urls,
  bookMarkRandoms,
  changeFolder,
  deleteSavedUrl,
  filterByFolder,
  save,
} from "../controllers/bookMarked.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";

const bookMarkedRoutes = Router();

bookMarkedRoutes.post("/", logInAuth, save);
// bookMarkedRoutes.post("/:folder", logInAuth, save);

bookMarkedRoutes.get("/bookMarkRandoms", bookMarkRandoms);
bookMarkedRoutes.get("/all_the_saved_urls", logInAuth, all_the_saved_urls);
bookMarkedRoutes.get("/deleteSavedUrl/:url_id", logInAuth, deleteSavedUrl);
bookMarkedRoutes.get("/:bookMarkId/folder/:folderId", logInAuth, changeFolder);
bookMarkedRoutes.get("/folder/:folderId", logInAuth, filterByFolder);

export default bookMarkedRoutes;
