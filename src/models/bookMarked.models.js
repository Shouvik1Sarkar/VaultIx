import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    title: {
      type: String,
    },

    image: {
      type: String,
    },

    contentType: {
      type: String,
      enum: ["video", "article", "post", "other"],
      default: "other",
    },

    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },

    // optional but VERY useful
    domain: {
      type: String, // youtube.com, twitter.com
    },
  },
  { timestamps: true },
);

bookmarkSchema.index({ createdBy: 1 });
bookmarkSchema.index({ folderId: 1 });
bookmarkSchema.index({ url: 1 });
const BookMarked = mongoose.model("BookMarked", bookmarkSchema);

export default BookMarked;
