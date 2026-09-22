import mongoose, { Model, Schema } from "mongoose";

export interface IUserInfo {
    _id?: mongoose.Types.ObjectId;
    BotID: string;
    AccountType: string;
    StrategyName: string;
    Leverage: number;
    ApiKey: string;
    ApiSecret: string;
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
}

const User = new Schema<IUserInfo>({
    _id: mongoose.Schema.Types.ObjectId,
    BotID: { type: String, required: true },
    AccountType: { type: String, required: true },
    StrategyName: { type: String, required: true, default: "EMA-RSI Momentum Scout" },
    Leverage: { type: Number, required: true },
    ApiKey: { type: String, required: true },
    ApiSecret: { type: String, required: true },
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
    AvoidLiquidation: {type: Boolean, default: true }
});

let UserModel: Model<IUserInfo>;

try {
    UserModel = mongoose.model<IUserInfo>("user");
} catch {
    UserModel = mongoose.model<IUserInfo>("user", User, "Users");
}

export default UserModel;