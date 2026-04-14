import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    folderName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
folderSchema.index({ folderName: 1, createdBy: 1 }, { unique: true });
const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
