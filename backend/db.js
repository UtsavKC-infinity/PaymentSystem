const { mongoose, Schema } = require("mongoose");
const bcrypt = require("bcrypt");

mongoose
  .connect(
    "mongodb+srv://utsavkcinfinity:1997%40ugust@cluster0.c3unglr.mongodb.net/paytmDb"
  )
  .catch((error) => handleError(error));
const UserSchema = new Schema({
  username: {
    type: String,
    reuired: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  firstName: { type: String, required: true, trim: true, maxLength: 50 },
  lastName: { type: String, required: true, trim: true, maxLength: 50 },
  password_hash: { type: String, required: true, minLength: 6 },
});
// Method to generate a hash from plain text
UserSchema.methods.createHash = async function (plainTextPassword) {
  // Hashing user's salt and password with 10 iterations,
  const saltRounds = 10;

  // First method to generate a salt and then create hash
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainTextPassword, salt);

  // Second mehtod - Or we can create salt and hash in a single method also
  // return await bcrypt.hash(plainTextPassword, saltRounds);
};
UserSchema.methods.validatePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

const User = mongoose.model("User", UserSchema);

const AccountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: { type: Number, required: true },
});

const Account = mongoose.model("Account", AccountSchema);

module.exports = { User, Account };
