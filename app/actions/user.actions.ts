"use server"

import { SECRET_PLACEHOLDER, SUPER_USER_ROLE } from "@/constants"
import { IUserInfoRuntime } from "@/interfaces"
import { decrypt, encrypt } from "@/lib/encryption"
import { connectDB } from "@/lib/mongoose"
import { getSession } from "@/lib/nextauth"
import UserModel from "@/schema/users"

export const getUserByEmail = async (email: string): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    if (session.user.email !== email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const user = await UserModel.findOne({ Email: email }).select("-Password").lean();
    if (!user) return null;

    const { ApiKey, ApiSecret, ...plainUser } = user;

    const decKey = ApiKey ? decrypt(ApiKey) : "";
    const decSec = ApiSecret ? SECRET_PLACEHOLDER : "";
    return {
        ...plainUser,
        DecryptedKey: decKey,
        DecryptedSecret: decSec
    }
}

export const updateUser = async (data: IUserInfoRuntime): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    if (data.Email !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const user = await UserModel.findOne({ Email: data.Email });
    if (!user) return null;

    if (!user.ApiKey && !user.ApiSecret) {
        if (data.DecryptedKey.length > 0) {
            const encKey = encrypt(data.DecryptedKey);
            user.ApiKey = encKey;
        }

        if (data.DecryptedSecret.length > 0 && data.DecryptedSecret !== SECRET_PLACEHOLDER) {
            const decSec = encrypt(data.DecryptedSecret);
            user.ApiSecret = decSec;
        }
    }

    if (data.Symbol) user.Symbol = data.Symbol;
    if (data.Leverage) user.Leverage = data.Leverage;
    if (data.AvoidLiquidation !== undefined) user.AvoidLiquidation = data.AvoidLiquidation;
    if (data.Demo !== undefined) user.Demo = data.Demo;
    if (data.StrategyName) user.StrategyName = data.StrategyName;

    await user.save();
    const updatedUser = await getUserByEmail(data.Email);
    return updatedUser
}