import { BinanceWithdrawalStatus } from "@/interfaces";
import mongoose, { Model, Schema } from "mongoose";

export interface ITransaction {
    _id: mongoose.Types.ObjectId;
    BotID: string;
    TXID: string;
    Amount: number;
    Description: string;
    isSettled: boolean;
    Status: BinanceWithdrawalStatus;
    Timestamp: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    _id: mongoose.Schema.Types.ObjectId,
    BotID: { type: String, required: true },
    TXID: { type: String, required: true },
    Amount: { type: Number, required: true },
    isSettled: { type: Boolean, default: false },
    Description: { type: String, default: "" },
    Status: { type: Number, enum: [BinanceWithdrawalStatus.AwaitingApproval, BinanceWithdrawalStatus.Cancelled, BinanceWithdrawalStatus.Completed, BinanceWithdrawalStatus.EmailSent, BinanceWithdrawalStatus.Failure, BinanceWithdrawalStatus.Processing, BinanceWithdrawalStatus.Rejected], required: true },
    Timestamp: { type: Date, default: Date.now }
});

let TransactionModel: Model<ITransaction>;
try {
    TransactionModel = mongoose.model<ITransaction>("transactions");
} catch {
    TransactionModel = mongoose.model<ITransaction>("transactions", TransactionSchema, "Transactions");
}

export default TransactionModel;