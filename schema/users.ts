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
    PasswordHash: string;
    AccountType: string;
    JoinedOn: Date;
    IsActive: boolean;
    LockUntil: Date | null;
    FailedAttempts: number;
    BinanceAPIKey: string;
    BinanceAPISecret: string;
    ConnectedAccounts: IConnectedAccount[];
}

const Users = new Schema<IUserInfo>({
    _id: mongoose.Schema.Types.ObjectId,
    UID: { type: String, required: true, unique: true },
    Name: { type: String, required: true },
    Email: { type: String, required: false },
    AccountType: {
        type: String,
        default: 'regular'
    },
    JoinedOn: { type: Date, default: Date.now },
    IsActive: { type: Boolean, default: true },
    LockUntil: { type: Date, default: null },
    FailedAttempts: { type: Number, default: 0 },
    PasswordHash: String,
    BinanceAPIKey: { type: String, default: "" },
    BinanceAPISecret: { type: String, default: "" },
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

Users.index({ UID: 1, BinanceAPIKey: 1 });

const UserModel: Model<IUserInfo> = models.users || mongoose.model<IUserInfo>("users", Users);
export default UserModel