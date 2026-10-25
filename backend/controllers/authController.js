const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendForgotPasswordEmail,
  sendChangePasswordEmail,
} = require("../services/emailService");

// Data models needed to wipe a user's data on account deletion
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Saving = require("../models/Saving");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const EMI = require("../models/EMI");
const Bill = require("../models/Bill");
const NetWorth = require("../models/NetWorth");
const NetWorthHistory = require("../models/NetWorthHistory");
const sendError = require("../utils/sendError");

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
    });
    await OTP.deleteMany({ email, type: "email-verify" });
    const otp = generateOTP();
    await OTP.create({ email, otp, type: "email-verify" });
    await sendVerificationEmail(email, otp);
    res.status(201).json({
      message: "Registration successful. Please check your email for OTP.",
    });
  } catch (err) {
    sendError(res, err);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({
      email,
      type: "email-verify",
      used: false,
    });
    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP expired or invalid. Please request a new one.",
      });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
      });
    }
    otpRecord.used = true;
    await otpRecord.save();
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { returnDocument: "after" },
    );
    const token = generateToken(user._id);
    res.status(200).json({
      message: "Email verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await OTP.deleteMany({ email, type });
    const otp = generateOTP();
    await OTP.create({ email, otp, type });
    if (type === "email-verify") {
      await sendVerificationEmail(email, otp);
    } else if (type === "forgot-password") {
      await sendForgotPasswordEmail(email, otp);
    } else if (type === "change-password") {
      await sendChangePasswordEmail(email, otp);
    }
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    sendError(res, err);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.isEmailVerified) {
      await OTP.deleteMany({ email, type: "email-verify" });
      const otp = generateOTP();
      await OTP.create({ email, otp, type: "email-verify" });
      await sendVerificationEmail(email, otp);
      return res.status(403).json({
        message: "Email not verified. A new OTP has been sent.",
        needsVerification: true,
        email,
      });
    }
    const token = generateToken(user._id);
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }
    await OTP.deleteMany({ email, type: "forgot-password" });
    const otp = generateOTP();
    await OTP.create({ email, otp, type: "forgot-password" });
    await sendForgotPasswordEmail(email, otp);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    sendError(res, err);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const otpRecord = await OTP.findOne({
      email,
      type: "forgot-password",
      used: false,
    });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }
    otpRecord.used = true;
    await otpRecord.save();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { returnDocument: "after" },
    );
    res.status(200).json({
      message: "Password reset successful. Please login.",
    });
  } catch (err) {
    sendError(res, err);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, otp, newPassword } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }
    const otpRecord = await OTP.findOne({
      email: user.email,
      type: "change-password",
      used: false,
    });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }
    otpRecord.used = true;
    await otpRecord.save();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { returnDocument: "after" },
    );
    res.status(200).json({
      message: "Password changed successfully. Please login again.",
    });
  } catch (err) {
    sendError(res, err);
  }
};

const sendChangePasswordOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await OTP.deleteMany({ email: user.email, type: "change-password" });
    const otp = generateOTP();
    await OTP.create({ email: user.email, otp, type: "change-password" });
    await sendChangePasswordEmail(user.email, otp);
    res.status(200).json({
      message: "OTP sent to your registered email",
    });
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE ACCOUNT — permanently removes the user and ALL
// their data across every collection. Requires the current
// password as a safety confirmation before proceeding.
// Data collections are deleted in parallel first; the User
// document itself is deleted LAST, so if anything fails
// partway through, the account still exists and the user
// isn't left in a broken half-deleted state.
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    await Promise.all([
      Expense.deleteMany({ userId }),
      Income.deleteMany({ userId }),
      Saving.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      EMI.deleteMany({ userId }),
      Bill.deleteMany({ userId }),
      NetWorth.deleteMany({ userId }),
      NetWorthHistory.deleteMany({ userId }),
      OTP.deleteMany({ email: user.email }),
    ]);

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  sendChangePasswordOTP,
  deleteAccount,
};
