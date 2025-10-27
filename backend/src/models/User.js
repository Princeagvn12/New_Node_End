const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
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
    }
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
    return await bcrypt.compare(candidatePassword, this.password);
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
    // Hasher le nouveau password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = { User };