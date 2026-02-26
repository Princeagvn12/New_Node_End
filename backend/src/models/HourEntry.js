const mongoose = require('mongoose');

const { Schema } = mongoose;

const HourEntrySchema = new Schema(
	{
		course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
		teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		date: { type: Date, default: Date.now },
		hours: { type: Number, required: true },
		description: { type: String },
	},
	{ timestamps: true }
);

// Indexes for common queries
HourEntrySchema.index({ course: 1 });
HourEntrySchema.index({ teacher: 1 });
HourEntrySchema.index({ date: -1 });

module.exports = mongoose.model('HourEntry', HourEntrySchema);