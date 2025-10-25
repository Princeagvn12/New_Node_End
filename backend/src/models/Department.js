const mongoose = require('mongoose');

const { Schema } = mongoose;

const DepartmentSchema = new Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		description: { type: String },
		mainTeacher: { type: Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

// Indexes
DepartmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', DepartmentSchema);