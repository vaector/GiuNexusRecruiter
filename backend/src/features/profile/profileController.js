const asyncHandler = require("../../middleware/asyncHandler");
const hf = require("../../services/hfService");
const User = require("../user/User");
const { uploadImage } = require("../../services/cloudinaryService")

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// GET /api/v1/profile — private
const getMyProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(createError(404, "User not found"));
  return res.status(200).json({ success: true, user });
});

// PATCH /api/v1/profile — private
const updateMyProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ["name", "bio", "profilePicture"];
  const updates = {};

  if (req.file) {
    try {
      const result = await uploadImage(req.file.buffer);
      updates.profilePicture = result.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError.message);
      return next(createError(500, "Image upload failed, please try again"));
    }
  }

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) return next(createError(404, "User not found"));
  return res.status(200).json({ success: true, user });
});

// PATCH /api/v1/profile/change-password — private
const changeMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(createError(400, "currentPassword and newPassword are required"));
  }
  if (newPassword.length < 6) {
    return next(createError(400, "Password must be at least 6 characters"));
  }
  const user = await User.findById(req.user._id);
  if (!user) return next(createError(404, "User not found"));
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return next(createError(401, "Current password is incorrect"));
  user.password = newPassword;
  await user.save();
  return res.status(200).json({ success: true, message: "Password updated successfully" });
});

// POST /api/v1/profile/extract-skills — jobSeeker only
const extractSkills = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user.bio || !user.bio.trim()) {
    return next(createError(400, "Bio is empty. Update your profile first."));
  }
  try {
    const result = await hf.tokenClassification({
      model: "dslim/bert-base-NER",
      inputs: user.bio,
    });
    const skills = [
      ...new Set(
        result
          .filter((entity) => ["MISC", "ORG"].includes(entity.entity_group))
          .map((entity) => entity.word.replace(/\.\s+/g, ".").replace(/\s+\./g, ".").replace(/##/g, ""))
      ),
    ];
    user.skills = skills;
    await user.save();
    return res.status(200).json({ success: true, skills, extracted: skills });
  } catch (hfError) {
    console.error("HuggingFace NER failed:", hfError.message);
    return res.status(200).json({ success: true, skills: user.skills, extracted: user.skills });
  }
});

// PATCH /api/v1/profile/mfa — private
const toggleMfa = asyncHandler(async (req, res, next) => {
  const { mfaEnabled, mfaMethod } = req.body;

  if (!['email_otp', 'totp'].includes(mfaMethod)) {
    return next(createError(400, "mfaMethod must be 'email_otp' or 'totp'"));
  }

  const user = await User.findById(req.user._id);
  if (!user) return next(createError(404, 'User not found'));

  if (mfaEnabled && mfaMethod === 'totp' && !user.totpSecret) {
    return next(createError(400, 'Set up TOTP first via POST /auth/setup-totp'));
  }

  user.mfaEnabled = mfaEnabled;
  user.mfaMethod = mfaMethod;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ success: true, mfaEnabled, mfaMethod });
});

module.exports = { getMyProfile, updateMyProfile, changeMyPassword, extractSkills, toggleMfa };
