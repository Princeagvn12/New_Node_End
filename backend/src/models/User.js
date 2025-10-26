const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const ROLES = [
	'admin',
	'rh',
	'formateur_principal',
	'formateur',
	'etudiant',
];

const UserSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password: { type: String, required: true },
		role: { type: String, enum: ROLES, default: 'etudiant' },
		department: { type: Schema.Types.ObjectId, ref: 'Department' },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

// Hash password before save if modified
UserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		return next();
	} catch (err) {
		return next(err);
	}
});

// Instance method to compare password
const comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ department: 1 });
const User = mongoose.model('User', UserSchema);
module.exports = {User, comparePassword};