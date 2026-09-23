"use server"

import { SECRET_PLACEHOLDER, SUPER_USER_ROLE } from "@/constants"
import { IUserInfoRuntime } from "@/interfaces"
import { decrypt, encrypt } from "@/lib/encryption"
import { connectDB } from "@/lib/mongoose"
import { getSession } from "@/lib/nextauth"
import UserModel, { IUserInfo } from "@/schema/users"

export const getUserByEmail = async (email: string): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    if (session.user.email !== email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const user = await UserModel.findOne({ Email: email }).select("-Password").lean();
    if (!user) return null;

    const returnObj = PlainUser(user);
    return JSON.parse(JSON.stringify(returnObj));
}

export const updateUser = async (data: IUserInfoRuntime): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    if (data.Email !== session.user.email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const user = await UserModel.findOne({ Email: data.Email });
    if (!user) return null;

    // Remove runtime-only fields and prevent client-supplied
    const {
        DecryptedKey,
        DecryptedSecret,
        BotID,
        UID,
        AccountType,
        PNL,
        UnpaidFee,
        IsApproved,
        IsActive,
        Password,
        ConnectedAccounts,
        ApiKey: _ApiKey,
        ApiSecret: _ApiSecret,
        ...rest
    } = data;

    const updateData: Partial<IUserInfo> = {
        ...rest
    };

    // Only populate credentials if they are missing from the database.
    if (!user.ApiKey?.encrypted && DecryptedKey.length > 0) {
        updateData.ApiKey = encrypt(DecryptedKey);
    }

    if (!user.ApiSecret?.encrypted && DecryptedSecret.length > 0 && DecryptedSecret !== SECRET_PLACEHOLDER) {
        updateData.ApiSecret = encrypt(DecryptedSecret);
    }

    const updatedUser = await UserModel.findOneAndUpdate(
        { Email: data.Email },
        { $set: updateData },
        { returnDocument: "after" }
    ).select("-Password").lean();

    if (!updatedUser) return null;

    const plainUser = PlainUser(updatedUser);
    return JSON.parse(JSON.stringify(plainUser));
};

const PlainUser = (userData: IUserInfo): IUserInfoRuntime => {
    const { ApiKey, ApiSecret, ...plainUser } = userData;

    const decKey = ApiKey?.encrypted ? decrypt(ApiKey) : "";
    const decSec = ApiSecret?.encrypted ? SECRET_PLACEHOLDER : "";

    const returnObj = {
        ...plainUser,
        DecryptedKey: decKey,
        DecryptedSecret: decSec
    }
    return returnObj
}