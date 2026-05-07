const hf = require("../../services/hfService");
const User = require("../user/User");

// POST /api/v1/profile/extract-skills — jobSeeker only
const extractSkills = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.bio || !user.bio.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bio is empty. Update your profile first.",
      });
    }

    try {
      const result = await hf.tokenClassification({
        model: "dslim/bert-base-NER",
        inputs: user.bio,
      });

      const skills = [
        ...new Set(
          result
            .filter((entity) =>
              ["B-MISC", "I-MISC", "B-ORG"].includes(entity.entity_group)
            )
            .map((entity) => entity.word)
        ),
      ];

      user.skills = skills;
      await user.save();

      return res.status(200).json({
        success: true,
        skills,
        extracted: skills,
      });
    } catch (hfError) {
      console.error("HuggingFace NER failed:", hfError.message);
      return res.status(200).json({
        success: true,
        skills: user.skills,
        extracted: user.skills,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { extractSkills };