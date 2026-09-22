import { Direction } from "@/interfaces";
import mongoose, { Model, Schema } from "mongoose";

export interface ITrades {
    _id: mongoose.Types.ObjectId;
    uid: string;
    orderId: string;
    entryPrice: number;
    symbol: string;
    quantity: number;
    side: Direction;
    notional: number;
    liquidationPrice: number;
    commission: number;
    BotID: string;
    Timestamp: Date;
    realizedProfit: number;
    serviceFee: number;
    isFilled: boolean;
    closeTime: Date | undefined;
    Reason: string;
    Demo: boolean;
}

const Trades = new Schema<ITrades>({
    _id: mongoose.Schema.Types.ObjectId,
    uid: { type: String, required: true },
    orderId: { type: String, required: true },
    entryPrice: { type: Number, required: true },
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true },
    // store as number matching the Direction enum (0 = Long, 1 = Short)
    side: { type: Number, enum: [Direction.Long, Direction.Short], required: true },
    notional: { type: Number, required: true },
    liquidationPrice: { type: Number, required: true },
    commission: { type: Number, required: true },
    BotID: { type: String, required: true },
    Timestamp: { type: Date, default: Date.now },
    realizedProfit: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    isFilled: { type: Boolean, default: false },
    closeTime: { type: Date, default: undefined },
    Reason: { type: String, default: "" },
    Demo: { type: Boolean, required: true }
});

let TradesModel: Model<ITrades>;
try {
    TradesModel = mongoose.model<ITrades>("trades");
} catch {
    TradesModel = mongoose.model<ITrades>("trades", Trades, "Trades");
}

export default TradesModel;