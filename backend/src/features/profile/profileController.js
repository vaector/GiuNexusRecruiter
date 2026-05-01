const User = require("../user/User");

const getMyProfile = async (req, res) => {
	const user = await User.findById(req.user._id);

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "Profile not found",
		});
	}

	return res.json({
		success: true,
		data: user,
	});
};

const updateMyProfile = async (req, res) => {
	const allowedFields = ["name", "bio", "profilePicture"];
	const updates = {};

	for (const field of allowedFields) {
		if (req.body[field] !== undefined) {
			updates[field] = req.body[field];
		}
	}

	const user = await User.findByIdAndUpdate(req.user._id, updates, {
		new: true,
		runValidators: true,
	});

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "Profile not found",
		});
	}

	return res.json({
		success: true,
		message: "Profile updated successfully",
		data: user,
	});
};

const changeMyPassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body;

	if (!currentPassword || !newPassword) {
		return res.status(400).json({
			success: false,
			message: "currentPassword and newPassword are required",
		});
	}

	const user = await User.findById(req.user._id);

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "Profile not found",
		});
	}

	const isMatch = await user.comparePassword(currentPassword);

	if (!isMatch) {
		return res.status(401).json({
			success: false,
			message: "Current password is incorrect",
		});
	}

	user.password = newPassword;
	await user.save();

	return res.json({
		success: true,
		message: "Password changed successfully",
	});
};

module.exports = {
	getMyProfile,
	updateMyProfile,
	changeMyPassword,
};
