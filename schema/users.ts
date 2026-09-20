import mongoose, { Model, models, Schema } from "mongoose";

export interface IConnectedAccount {
    platform: "google" | "github" | "facebook" | "twitter" | "linkedin";
    url?: string;
    email?: string;
    providerAccountId?: string;
    isVerified?: boolean;
}

export interface IUserInfo {
    _id?: mongoose.Types.ObjectId;
    UID: string;
    Name: string;
    Email: string;
    Image: string;
    Role: string;
    SchoolID: string;
    Gender: string;
    ClassUID: string;
    PasswordHash: string;
    Phone: string;
    AccountType: string;
    CNIC: string;
    Address: string;
    ParentUID: string[];
    DOB: Date;
    JoinedOn: Date;
    IsActive: boolean;
    FeeOrSalary: number;
    LockUntil: Date | null;
    FailedAttempts: number;
    ConnectedAccounts: IConnectedAccount[];
}

const Users = new Schema<IUserInfo>({
    _id: mongoose.Schema.Types.ObjectId,
    UID: { type: String, required: true, unique: true },
    Name: { type: String, required: true },
    Email: { type: String, required: false },
    Image: {
        type: String,
        default: 'default'
    },
    AccountType: {
        type: String,
        default: 'regular'
    },
    Address: {
        type: String,
        default: 'N/A'
    },
    ParentUID: {
        type: [String],
        default: []
    },
    DOB: { type: Date },
    JoinedOn: { type: Date, default: Date.now },
    IsActive: { type: Boolean, default: true },
    FeeOrSalary: { type: Number },
    LockUntil: { type: Date, default: null },
    FailedAttempts: { type: Number, default: 0 },
    CNIC: {
        type: String,
        default: '00000-0000000-0'
    },
    Gender: String,
    ClassUID: { type: String, default: '' },
    PasswordHash: String,
    Role: String,
    SchoolID: String,
    Phone: {
        type: String,
        default: '+920000000000'
    },
    ConnectedAccounts: {
        type: [
            {
                platform: {
                    type: String,
                    enum: ["google", "github", "facebook", "twitter", "linkedin"],
                    required: true
                },
                url: { type: String },
                email: { type: String },
                isVerified: { type: Boolean, default: false },
                providerAccountId: { type: String, default: "" }
            }
        ],
        default: []
    }
});

Users.index({ UID: 1, SchoolID: 1 });

const UserModel: Model<IUserInfo> = models.users || mongoose.model<IUserInfo>("users", Users);
export default UserModel