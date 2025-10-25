const mongoose = require('mongoose');

const { Schema } = mongoose;

const CourseSchema = new Schema(
	{
		title: { type: String, required: true, trim: true },
		code: { type: String, required: true, trim: true, unique: true },
		description: { type: String },
		department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
		teacher: { type: Schema.Types.ObjectId, ref: 'User' },
		students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
	},
	{ timestamps: true }
);

// Indexes to speed up searches and filters
// Unique index already exists on `code` via schema definition
CourseSchema.index({ department: 1 });
CourseSchema.index({ teacher: 1 });
// Full-text search on title and description
CourseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', CourseSchema);