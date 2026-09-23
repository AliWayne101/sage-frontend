import mongoose, { Model, Schema } from "mongoose";

export interface IEncryptedCredential {
    encrypted: string;
    iv: string;
    authTag: string;
}

const EncryptedCredentialSchema = new Schema<IEncryptedCredential>(
    {
        encrypted: { type: String, required: true },
        iv: { type: String, required: true },
        authTag: { type: String, required: true },
    },
    { _id: false }
);

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
    BotID: string;
    AccountType: string;
    StrategyName: string;
    Leverage: number;
    ApiKey?: IEncryptedCredential;
    ApiSecret?: IEncryptedCredential;
    Symbol: string;
    IsActive: boolean;
    PNL: number;
    UnpaidFee: number,
    IsHalted: boolean;
    IsApproved: boolean;
    Demo: boolean;
    Name: string;
    Email: string;
    Password: string;
    AvoidLiquidation: boolean;
    ConnectedAccounts: IConnectedAccount[];
}

const User = new Schema<IUserInfo>({
    _id: mongoose.Schema.Types.ObjectId,
    UID: { type: String, required: true },
    BotID: { type: String, required: true },
    AccountType: { type: String, required: true },
    StrategyName: { type: String, required: true, default: "EMA-RSI Momentum Scout" },
    Leverage: { type: Number, required: true },
    ApiKey: {
        type: EncryptedCredentialSchema,
        required: false,
    },
    ApiSecret: {
        type: EncryptedCredentialSchema,
        required: false,
    },
    Symbol: { type: String, required: true },
    IsActive: { type: Boolean, default: true },
    PNL: { type: Number, default: 0 },
    UnpaidFee: { type: Number, default: 0 },
    IsHalted: { type: Boolean, default: true },
    IsApproved: { type: Boolean, default: false },
    Demo: { type: Boolean, default: false },
    Email: { type: String, required: true },
    Name: { type: String, required: true },
    Password: { type: String, required: true },
    AvoidLiquidation: { type: Boolean, default: true },
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

let UserModel: Model<IUserInfo>;

try {
    UserModel = mongoose.model<IUserInfo>("user");
} catch {
    UserModel = mongoose.model<IUserInfo>("user", User, "Users");
}

export default UserModel;