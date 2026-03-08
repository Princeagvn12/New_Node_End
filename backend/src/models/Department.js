const mongoose = require('mongoose');

const { Schema } = mongoose;

const DepartmentSchema = new Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		description: { type: String },
		mainTeacher: { type: Schema.Types.ObjectId, ref: 'User' },
	},
	{ 
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true }
	}
);

// Virtual for courses linked to this department
DepartmentSchema.virtual('courses', {
	ref: 'Course',
	localField: '_id',
	foreignField: 'department'
});


// Indexes
// DepartmentSchema.index({ name: 1 });

module.exports = mongoose.model('Department', DepartmentSchema);