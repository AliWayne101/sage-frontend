import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { Direction } from "@/interfaces";
import TradesModel from "./schema/trades";
import UserModel from "./schema/users";
import { connectDB } from "./lib/mongoose";

const UID = "mock-ali-wains-001";
const BOT_ID = "mock-bot-001";

function dateDaysAgo(days: number, hour: number, minute: number) {
    const date = new Date();

    date.setDate(date.getDate() - days);
    date.setHours(hour, minute, 0, 0);

    return date;
}

function orderId(index: number) {
    return `MOCK-${Date.now()}-${index}`;
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

    const password = await bcrypt.hash("123", 10);

    await UserModel.create({
        _id: new mongoose.Types.ObjectId(),
        UID,
        BotID: BOT_ID,
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

            BotID: BOT_ID,

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