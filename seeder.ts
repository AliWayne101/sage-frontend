import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { BinanceWithdrawalStatus, Direction } from "@/interfaces";
import TradesModel from "./schema/trades";
import UserModel from "./schema/users";
import { connectDB } from "./lib/mongoose";
import TransactionModel from "./schema/transactions";

const UID = "mock-ali-wains-001";

function dateDaysAgo(days: number, hour: number, minute: number) {
    const date = new Date();

    date.setDate(date.getDate() - days);
    date.setHours(hour, minute, 0, 0);

    return date;
}

function orderId(index: number) {
    return `MOCK-${Date.now()}-${index}`;
}

export async function seedMockTransactions() {
    await connectDB();
    await TransactionModel.insertMany(transactions);
}

export async function seedMockData() {
    await connectDB();
    // // Remove existing mock data first
    // await TradesModel.deleteMany({
    //     uid: UID,
    // });

    // await UserModel.deleteOne({
    //     UID,
    // });

    // -----------------------------------------
    // USER
    // -----------------------------------------

    const password = await bcrypt.hash("123", 12);

    await UserModel.create({
        _id: new mongoose.Types.ObjectId(),
        UID,
        BotID: UID,
        AccountType: "SUPER",
        Name: "Ali Wains",
        Email: "aliwains@mock.com",
        Password: password,
    });

    // -----------------------------------------
    // TRADES
    // -----------------------------------------

    const trades = [
        {
            Timestamp: dateDaysAgo(3, 10, 15),
            side: Direction.Long,
            entryPrice: 4312.50,
            quantity: 0.055,
            realizedProfit: 2.84,
            commission: 0.47,
            Reason: "Take Profit",
            closeMinutes: 32,
        },

        {
            Timestamp: dateDaysAgo(3, 16, 42),
            side: Direction.Short,
            entryPrice: 4385.20,
            quantity: 0.050,
            realizedProfit: -1.26,
            commission: 0.44,
            Reason: "Stop Loss",
            closeMinutes: 27,
        },

        {
            Timestamp: dateDaysAgo(2, 9, 20),
            side: Direction.Long,
            entryPrice: 4258.75,
            quantity: 0.060,
            realizedProfit: 3.17,
            commission: 0.51,
            Reason: "Take Profit",
            closeMinutes: 41,
        },

        {
            Timestamp: dateDaysAgo(2, 13, 55),
            side: Direction.Short,
            entryPrice: 4320.10,
            quantity: 0.052,
            realizedProfit: 1.92,
            commission: 0.45,
            Reason: "Take Profit",
            closeMinutes: 36,
        },

        {
            Timestamp: dateDaysAgo(2, 19, 35),
            side: Direction.Long,
            entryPrice: 4198.40,
            quantity: 0.058,
            realizedProfit: -0.88,
            commission: 0.49,
            Reason: "Stop Loss",
            closeMinutes: 29,
        },

        {
            Timestamp: dateDaysAgo(1, 8, 40),
            side: Direction.Long,
            entryPrice: 4145.60,
            quantity: 0.061,
            realizedProfit: 2.65,
            commission: 0.50,
            Reason: "Take Profit",
            closeMinutes: 38,
        },

        {
            Timestamp: dateDaysAgo(1, 15, 25),
            side: Direction.Short,
            entryPrice: 4218.30,
            quantity: 0.055,
            realizedProfit: 2.21,
            commission: 0.46,
            Reason: "Take Profit",
            closeMinutes: 31,
        },

        {
            Timestamp: dateDaysAgo(1, 21, 10),
            side: Direction.Short,
            entryPrice: 4162.80,
            quantity: 0.057,
            realizedProfit: -1.14,
            commission: 0.47,
            Reason: "Stop Loss",
            closeMinutes: 24,
        },

        {
            Timestamp: dateDaysAgo(0, 7, 30),
            side: Direction.Long,
            entryPrice: 4098.25,
            quantity: 0.060,
            realizedProfit: 2.93,
            commission: 0.49,
            Reason: "Take Profit",
            closeMinutes: 35,
        },

        // Open trade
        {
            Timestamp: dateDaysAgo(0, 9, 5),
            side: Direction.Short,
            entryPrice: 4142.70,
            quantity: 0.055,
            realizedProfit: 0,
            commission: 0,
            Reason: "",
            closeMinutes: null,
        },
    ];

    const tradeDocuments = trades.map((trade, index) => {

        const notional =
            trade.entryPrice * trade.quantity;

        const closeTime =
            trade.closeMinutes !== null
                ? new Date(
                    trade.Timestamp.getTime() +
                    trade.closeMinutes * 60 * 1000
                )
                : undefined;

        const liquidationPrice =
            trade.side === Direction.Long
                ? trade.entryPrice * 0.90
                : trade.entryPrice * 1.10;

        return {
            _id: new mongoose.Types.ObjectId(),

            uid: UID,

            orderId: orderId(index + 1),

            entryPrice: trade.entryPrice,

            symbol: "ETHUSDT",

            quantity: trade.quantity,

            side: trade.side,

            notional,

            liquidationPrice,

            commission: trade.commission,

            BotID: UID,

            Timestamp: trade.Timestamp,

            realizedProfit: trade.realizedProfit,

            serviceFee: 0,

            isFilled: true,

            closeTime,

            Reason: trade.Reason,

            Demo: true,
        };
    });

    await TradesModel.insertMany(tradeDocuments);

    // -----------------------------------------
    // CALCULATE USER PNL
    // -----------------------------------------

    const pnl = tradeDocuments.reduce(
        (total, trade) =>
            total +
            trade.realizedProfit -
            trade.commission -
            trade.serviceFee,
        0
    );

    await UserModel.updateOne(
        { UID },
        {
            $set: {
                PNL: Number(pnl.toFixed(2)),
            },
        }
    );

    console.log("Mock data created.");
    console.log("User: Ali Wains");
    console.log("Trades:", tradeDocuments.length);
    console.log("PNL:", pnl.toFixed(2));
}

const BOT_ID = "mock-ali-wains-001";
const transactions = Array.from({ length: 8 }, (_, i) => {
    const statuses = [
        BinanceWithdrawalStatus.Completed,
        BinanceWithdrawalStatus.Processing,
        BinanceWithdrawalStatus.EmailSent,
        BinanceWithdrawalStatus.AwaitingApproval,
        BinanceWithdrawalStatus.Cancelled,
        BinanceWithdrawalStatus.Rejected,
        BinanceWithdrawalStatus.Failure,
    ];

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
        _id: new mongoose.Types.ObjectId(),
        BotID: BOT_ID,
        TXID: `MOCK-TX-${Date.now()}-${i + 1}`,
        Amount: Number((Math.random() * 4.9 + 0.1).toFixed(2)),
        Description: "Mock USDT withdrawal transaction",
        isSettled: status === BinanceWithdrawalStatus.Completed,
        Status: status,
        Timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
    };
});