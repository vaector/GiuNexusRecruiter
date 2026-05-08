const mongoose = require("mongoose");

const SavedSearchFiltersSchema = new mongoose.Schema(
  {
    keywords: {
      type: String,
    },
    location: {
      type: String,
    },
    type: {
      type: String,
    },
    category: {
      type: String,
    },
    isRemote: {
      type: Boolean,
    },
    salaryMin: {
      type: Number,
    },
  },
  { _id: false }
);

const SavedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    filters: {
      type: SavedSearchFiltersSchema,
      default: () => ({}),
    },
    alertEnabled: {
      type: Boolean,
      default: false,
    },
    lastCheckedAt: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "saved_searches",
  }
);

SavedSearchSchema.index({ user: 1 });
SavedSearchSchema.index({ active: 1, lastCheckedAt: 1 });
SavedSearchSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ user: this.user, active: true });
    if (count >= 10) return next(new Error('Maximum of 10 active saved searches allowed'));
  }
  next();
});

module.exports =
  mongoose.models.SavedSearch ||
  mongoose.model("SavedSearch", SavedSearchSchema);
