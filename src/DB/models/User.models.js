import mongoose from 'mongoose';
export const genderEnum = { male: "male", female: "female" };
export const roleEnum = { user: "user", admin: "admin" };
export const providerEnum = { system: "system", google: "google" }

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: [20, "firstName max length is 20 char and you have entered {VALUE}"]
    },
    lastName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: [20, "lastName max length is 20 char and you have entered {VALUE}"]
    },
    email: { type: String, required: true, unique: true },
    password: {
        type: String, required: function () {
            return this.provider === providerEnum.system ? true : false
        }
    },
    oldPasswords: [String],
    forgotPasswordOtp: String,
    phone: {
        type: String, required: function () {
            return this.provider === providerEnum.system ? true : false
        }
    },
    gender: {
        type: String,
        enum: {
            values: Object.values(genderEnum),
            message: `gender only allows ${Object.values(genderEnum)}`
        },
        default: genderEnum.male
    },
    role: {
        type: String,
        enum: Object.values(roleEnum),
        default: roleEnum.user
    },
    provider: { type: String, enum: Object.values(providerEnum), default: providerEnum.system },
    confirmEmail: Date,
    confirmEmailOtp: String,
    picture: { secure_url: String, public_id: String },
    coverImages: [{ secure_url: String, public_id: String }],

    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    restoredAt: Date,
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    changeCredentialsTime: Date,

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual("fullName")
    .set(function (value) {
        const [firstName, lastName] = value?.split(" ") || [];
        this.set({ firstName, lastName });
    })
    .get(function () {
        return `${this.firstName}  ${this.lastName}`
    });

    userSchema.virtual("messages",{
        localField:"_id",
        foreignField:"receiverId",
        ref:"Message"
    } ) 
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
UserModel.syncIndexes()


