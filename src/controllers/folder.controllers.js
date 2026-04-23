import redisClient from "../../config/redis.config.js";
import BookMarked from "../models/bookMarked.models.js";
import Folder from "../models/folders.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";

// export const randomFolder = asyncHandler(async (req, res) => {
//   return res.send("HELLO this is test");
// });
export const createFolder = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { folderName } = req.body;

  const folder = await Folder.create({ folderName, createdBy: userId });

  if (!folder) {
    throw new ApiError(500, "Folder not created");
  }

  await redisClient.del(`folder:${userId}`);
  return res.status(201).json(new ApiResponse(201, folder, "Folder created"));
});

export const deleteFolder = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { folder } = req.params;

  const findFolder = await Folder.findOne({
    _id: folder,
    createdBy: userId,
  });

  if (!findFolder) {
    throw new ApiError(404, "Folder not found");
  }

  if (["all", "video", "article", "post"].includes(findFolder.folderName)) {
    throw new ApiError(400, "System folder cannot be deleted");
  }

  const defaultFolder = await Folder.findOne({
    folderName: "all",
    createdBy: userId,
  });

  await BookMarked.updateMany(
    { folderId: findFolder._id },
    { $set: { folderId: defaultFolder._id } },
  );

  await Folder.findByIdAndDelete(findFolder._id);
  await redisClient.del(`folder:${userId}`);
  res.status(200).json(new ApiResponse(200, null, "Folder deleted"));
});

export const renameFolder = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { name } = req.body;
  const { folder } = req.params;

  const findFolder = await Folder.findOne({
    _id: folder,
    createdBy: userId,
  });

  if (!findFolder) {
    throw new ApiError(404, "Folder not found");
  }

  if (["all", "video", "article", "post"].includes(findFolder.folderName)) {
    throw new ApiError(400, "System folder cannot be renamed");
  }

  const updatedFolder = await Folder.findByIdAndUpdate(
    folder,
    { $set: { folderName: name } },
    { new: true },
  );

  if (!updatedFolder) {
    throw new ApiError(500, "Folder not renamed");
  }

  await redisClient.del(`folder:${userId}`);
  res.status(200).json(new ApiResponse(200, updatedFolder, "Folder renamed"));
});

export const allFolders = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const cachedKey = `folder:${userId}`;
  let cachedFolder;

  try {
    cachedFolder = await redisClient.get(cachedKey);
  } catch (err) {
    console.log("Redis error, fallback to DB");
  }

  if (cachedFolder) {
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cachedFolder), "Folders cached"));
  }

  const allFolders = await Folder.find({ createdBy: userId });

  if (!allFolders) {
    throw new ApiError(404, "Folders not found");
  }

  const cleanFolder = allFolders.map((folder) => folder.toObject());

  try {
    await redisClient.setEx(cachedKey, 60, JSON.stringify(cleanFolder));
  } catch (err) {
    console.log("Redis set failed");
  }

  return res.status(200).json(new ApiResponse(200, cleanFolder, "Folders"));
});
