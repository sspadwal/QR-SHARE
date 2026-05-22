import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.String,
      ref:"Session",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 60 * 1000),
    },

    files: [
      {
        originalName: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        downloadUrl: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const File = mongoose.model("File", fileSchema);

export default File;