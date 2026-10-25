const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    avatarColor: {
      type: String,
      default: "#2563eb",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
