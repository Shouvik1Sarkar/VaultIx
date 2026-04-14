import BookMarked from "../models/bookMarked.models.js";
import Folder from "../models/folders.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";

export const randomFolder = asyncHandler(async (req, res) => {
  return res.send("HELLO this is test");
});
export const createFolder = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError("Not logged in");
  }
  const { folderName } = req.body;
  const folder = await Folder.create({ folderName, createdBy: user._id });
  // console.log("FOLDER: ", folder);
  if (!folder) {
    throw new ApiError("FOLDER NOT CREATED.");
  }

  return res.status(201).json(new ApiResponse(201, folder, "This is it"));
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const user = req.user;
  const { folder } = req.params;

  const findFolder = await Folder.findOne({
    _id: folder,
    createdBy: user._id,
  });

  // console.log("FIND FOLDER: ", findFolder);

  if (!findFolder) {
    throw new ApiError(404, "Folder not found");
  }
  if (["all", "video", "article", "post"].includes(findFolder.folderName)) {
    throw new ApiError(400, "System folder cannot be deleted");
  }
  // find default folder
  const defaultFolder = await Folder.findOne({
    folderName: "all",
    createdBy: user._id,
  });
  // console.log("DEFAULT FODLER: ", defaultFolder);

  // move bookmarks instead of deleting
  await BookMarked.updateMany(
    { folderId: findFolder._id },
    { $set: { folderId: defaultFolder._id } },
  );

  await Folder.findByIdAndDelete(findFolder._id);

  res.status(200).json(new ApiResponse(200, null, "Folder deleted"));
});

export const renameFolder = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name } = req.body;
  const { folder } = req.params;

  const findFolder = await Folder.findOneAndUpdate(
    {
      _id: folder,
      createdBy: user._id,
    },
    { $set: { folderName: name } },
  );

  if (!findFolder) {
    throw new ApiError(404, "Folder not found");
  }
  await findFolder.save();
  res.status(200).json(new ApiResponse(200, findFolder, "Folder renamed"));
});

export const allFolders = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(400, "User not found.");
  }

  const allFolders = await Folder.find({ createdBy: user._id });

  if (!allFolders) {
    throw new ApiError(400, "Folders not found");
  }
  // console.log("FOLDERS: ", allFolders);
  return res.status(200).json(new ApiResponse(200, allFolders, "FOLDERS"));
});
