import BookMarked from "../models/bookMarked.models.js";
import Folder from "../models/folders.models.js";

import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import ogs from "open-graph-scraper";
import mongoose from "mongoose";
import redisClient from "../../config/redis.config.js";

// Functions

const getMetadata = async (url) => {
  try {
    const { result } = await ogs({ url });

    // return result;
    return {
      title: result.ogTitle || result.twitterTitle,
      image: result.ogImage?.[0]?.url,
    };
  } catch (err) {
    console.log(err);
    return {};
  }
};

const getContentType = (url) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return "video";
  }

  if (url.includes("twitter.com") || url.includes("x.com")) {
    return "post";
  }

  if (url.includes("instagram.com")) {
    return "post";
  }

  return "article";
};

const getDomain = (url) => {
  return new URL(url).hostname;
};

// Controllers

// export const bookMarkRandoms = asyncHandler(async (req, res) => {
//   return res.send("HELLO this is test");
// });

export const save = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { url, folder } = req.body;

  if (!url) {
    throw new ApiError(400, "URL required");
  }

  try {
    new URL(url);
  } catch {
    throw new ApiError(400, "Invalid URL");
  }

  const existing = await BookMarked.findOne({ url, createdBy: userId });

  if (existing) {
    throw new ApiError(400, "Bookmark already saved");
  }

  const { title, image } = await getMetadata(url);
  const type = getContentType(url);
  const domain = getDomain(url);

  if (folder && !mongoose.Types.ObjectId.isValid(folder)) {
    throw new ApiError(400, "Invalid folder id");
  }

  let findFolder;

  if (folder) {
    findFolder = await Folder.findOne({ _id: folder, createdBy: userId });
  } else {
    findFolder =
      (await Folder.findOne({ folderName: type, createdBy: userId })) ??
      (await Folder.findOne({ folderName: "all", createdBy: userId }));
  }

  if (!findFolder) {
    throw new ApiError(404, "Folder not found");
  }

  const createBookMark = await BookMarked.create({
    url,
    title: title ?? url,
    image: image ?? "",
    contentType: type,
    domain,
    createdBy: userId,
    folderId: findFolder._id,
  });

  if (!createBookMark) {
    throw new ApiError(500, "Bookmark not created");
  }

  try {
    await redisClient.del(`folder:${userId}`);
    const keys = await redisClient.keys(`urls:${userId}:*`);
    if (keys.length) await redisClient.del(keys);
    const filterKeys = await redisClient.keys(`filterUrl:${userId}:*`);
    if (filterKeys.length) await redisClient.del(filterKeys);
  } catch (error) {
    console.log("REDIS DELETE ERROR", error);
  }

  res.status(201).json(new ApiResponse(201, createBookMark, "Bookmark saved"));
});

export const all_the_saved_urls = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "User not logged in");
  }

  const userId = user._id;
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cachedKey = `urls:${userId}:page:${page}:limit:${limit}`;
  let cachedUrl;

  try {
    cachedUrl = await redisClient.get(cachedKey);
  } catch (err) {
    console.log("Redis error, fallback to DB");
  }

  if (cachedUrl) {
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cachedUrl), "URLs cached"));
  }

  const allUrls = await BookMarked.find({ createdBy: userId })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate("folderId", "folderName");

  const cleanUrl = allUrls.map((f) => f.toObject());

  try {
    await redisClient.setEx(cachedKey, 60, JSON.stringify(cleanUrl));
  } catch (err) {
    console.log("Redis set failed");
  }

  return res.status(200).json(new ApiResponse(200, cleanUrl, "All URLs"));
});

export const deleteSavedUrl = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { url_id } = req.params;

  if (!url_id) {
    throw new ApiError(400, "URL required");
  }

  const value = await BookMarked.findOneAndDelete({
    _id: url_id,
    createdBy: userId,
  });

  if (!value) {
    throw new ApiError(404, "Bookmark not found");
  }

  try {
    await redisClient.del(`folder:${userId}`);
    const keys = await redisClient.keys(`urls:${userId}:*`);
    if (keys.length) await redisClient.del(keys);
    const filterKeys = await redisClient.keys(`filterUrl:${userId}:*`);
    if (filterKeys.length) await redisClient.del(filterKeys);
  } catch (error) {
    console.log("REDIS DELETE ERROR", error);
  }

  return res.status(200).json(new ApiResponse(200, null, "Bookmark deleted"));
});

export const changeFolder = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { bookMarkId, folderId } = req.params;

  const bookMark = await BookMarked.findOne({
    _id: bookMarkId,
    createdBy: userId,
  });

  if (!bookMark) {
    throw new ApiError(404, "Bookmark not found");
  }

  const folder = await Folder.findOne({
    _id: folderId,
    createdBy: userId,
  });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  bookMark.folderId = folder._id;
  await bookMark.save();

  try {
    await redisClient.del(`folder:${userId}`);
    const keys = await redisClient.keys(`urls:${userId}:*`);
    if (keys.length) await redisClient.del(keys);
    const filterKeys = await redisClient.keys(`filterUrl:${userId}:*`);
    if (filterKeys.length) await redisClient.del(filterKeys);
  } catch (error) {
    console.log("REDIS DELETE ERROR", error);
  }

  return res.status(200).json(new ApiResponse(200, bookMark, "Folder changed"));
});

export const filterByFolder = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const { folderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(folderId)) {
    throw new ApiError(400, "Invalid folder id");
  }

  const cachedKey = `filterUrl:${userId}:${folderId}`;
  let cachedUrl;

  try {
    cachedUrl = await redisClient.get(cachedKey);
  } catch (err) {
    console.log("Redis error, fallback to DB");
  }

  if (cachedUrl) {
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cachedUrl), "Bookmarks cached"));
  }

  const folder = await Folder.findOne({ _id: folderId, createdBy: userId });

  if (!folder) {
    throw new ApiError(404, "Folder not found");
  }

  const bookmarks = await BookMarked.find({
    folderId,
    createdBy: userId,
  }).sort({ createdAt: -1 });

  const cleanUrl = bookmarks.map((f) => f.toObject());

  try {
    await redisClient.setEx(cachedKey, 60, JSON.stringify(cleanUrl));
  } catch (err) {
    console.log("Redis set failed");
  }

  res.status(200).json(new ApiResponse(200, cleanUrl, "Filtered bookmarks"));
});
