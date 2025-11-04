const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Ne pas inclure le password par défaut dans les queries
    },
    role: {
      type: String,
      enum: ['admin', 'rh', 'formateur_principal', 'formateur', 'etudiant'],
      default: 'etudiant'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // resetPasswordToken: {
    //   type: String,
    //   default: undefined
    // },
    // resetPasswordExpires: {
    //   type: Date,
    //   default: undefined
    // },
    resetCodeHash: { type: String },
    resetCodeExpiry: { type: Date }
  },
  {
    timestamps: true
  }
);

// Indexation pour performance
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });

// Méthode d'instance pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // this.password contient le hash stocké en base
    if (!this.password) {
      // No password stored
      return false;
    }

    // Compare once and return boolean
    const match = await bcrypt.compare(candidatePassword, this.password);
    return !!match;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Hook pre-save pour hasher le password si modifié
userSchema.pre('save', async function(next) {
  // Si le password n'a pas été modifié, passer
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Si la valeur ressemble déjà à un hash bcrypt, ne pas re-hasher
    if (typeof this.password === 'string' && this.password.startsWith('$2')) {
      return next();
    }

    // Hasher le nouveau password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
const User = mongoose.model('User', userSchema)
module.exports = {User} ;