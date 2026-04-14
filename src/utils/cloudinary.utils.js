import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_CLOUD_KEY,
  CLOUDINARY_CLOUD_SECRET,
} from "../../config/env.config.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_CLOUD_KEY,
  api_secret: CLOUDINARY_CLOUD_SECRET,
});

export async function uploadFile(imagePath) {
  const options = {
    // resource_type: "auto", // this is when i want to use both image and videos
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  };
  try {
    const result = await cloudinary.uploader.upload(imagePath, options);
    fs.unlinkSync(imagePath);
    // console.log(result);
    return result.secure_url;
  } catch (error) {
    fs.unlinkSync(imagePath);
  }
}
