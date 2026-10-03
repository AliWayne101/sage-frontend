"use server"
import { SUPER_USER_ROLE } from "@/constants";
import { connectDB } from "@/lib/mongoose";
import { getSession } from "@/lib/nextauth";
import TransactionModel, { ITransaction } from "@/schema/transactions";
import UserModel from "@/schema/users";

export const getTransactionsByTimeRange = async (botId: string, from: string, to: string): Promise<ITransaction[] | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    const user = await UserModel.findOne({ BotID: botId });
    if (!user) return null;

    if (botId !== session.user.uid && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const startDate = new Date(from);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);

    const transactions = await TransactionModel.find({
        BotID: botId,
        Timestamp: {
            $gte: startDate, $lte: endDate
        }
    }).sort({ Timestamp: -1 }).exec();
    return JSON.parse(JSON.stringify(transactions));
}