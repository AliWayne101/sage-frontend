"use server"

import { SECRET_PLACEHOLDER, SUPER_USER_ROLE } from "@/constants"
import { IDecryptedKeys, IUserInfoRuntime } from "@/interfaces"
import { decrypt, encrypt } from "@/lib/encryption"
import { connectDB } from "@/lib/mongoose"
import { getSession } from "@/lib/nextauth"
import { HashPassword } from "@/lib/serverUtils"
import UserModel, { IBinanceAPIKey, IUserInfo } from "@/schema/users"
import mongoose from "mongoose"
import { server } from "./server.actions"
import { generateID } from "@/utils"

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

export const getUserByBotID = async (botID: string): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    const session = await getSession();
    if (!session) return null;

    const user = await UserModel.findOne({ BotID: botID }).select("-Password").lean();
    if (!user) return null;

    if (session.user.email !== user.Email && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const returnObj = PlainUser(user);
    return JSON.parse(JSON.stringify(returnObj));
}

export const getAllUsers = async (): Promise<IUserInfoRuntime[]> => {
    await connectDB();
    const session = await getSession();
    if (!session) return [];

    const users = await UserModel.find({}).select("-Password").lean();
    if (!users || users.length === 0) return [];

    if (session.user.accountType !== SUPER_USER_ROLE)
        return [];

    const returnObj = users.map((user) => PlainUser(user));
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
        _id,
        DecryptedKey,
        DecryptedSecret,
        DecryptedAPIKeys,
        BotID,
        UID,
        AccountType,
        PNL,
        UnpaidFee,
        IsApproved,
        IsActive,
        Password,
        ConnectedAccounts,
        APIKeys,
        LockUntil,
        ...rest
    } = data;

    const updateData: Partial<IUserInfo> = {
        ...rest
    };

    const newKeys = DecryptedAPIKeys.filter((e) => e.id === "new");

    if (newKeys.length > 0) {
        const existingAPIKeys = user.APIKeys ?? [];

        const existingDecryptedKeys = existingAPIKeys
            .filter((key) => key.apiKey)
            .map((key) => ({
                apiKey: decrypt(key.apiKey!),
                isDemo: key.isDemo
            }));

        const constructedKeys: IBinanceAPIKey[] = [];

        for (const newKey of newKeys) {
            if (!newKey.DecryptedKey || !newKey.DecryptedSecret) continue;

            const keyAlreadyExists = existingDecryptedKeys.some(
                (existingKey) =>
                    existingKey.apiKey === newKey.DecryptedKey
            );

            if (keyAlreadyExists) continue;

            const sideAlreadyExists = [
                ...existingDecryptedKeys,
                ...constructedKeys
            ].some(
                (existingKey) =>
                    existingKey.isDemo === newKey.isDemo
            );

            if (sideAlreadyExists) {
                continue;
            }

            constructedKeys.push({
                id: `SAGE-API-${generateID()}`,
                isDemo: newKey.isDemo,
                label: newKey.label,
                apiKey: encrypt(newKey.DecryptedKey),
                apiSecret: encrypt(newKey.DecryptedSecret)
            });
        }

        if (constructedKeys.length > 0) {
            updateData.APIKeys = [
                ...existingAPIKeys,
                ...constructedKeys
            ];
        }
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

export const createUser = async (userData: Partial<IUserInfoRuntime>): Promise<IUserInfoRuntime | null> => {
    const session = await getSession();
    await connectDB();
    if (!session) return null;

    if (session.user.accountType !== SUPER_USER_ROLE) return null;

    const { DecryptedAPIKeys, Password, ...rest } = userData;
    if (!Password) return null;
    const hashedPassword = await HashPassword(Password);

    const newUser: Partial<IUserInfo> = {
        ...rest,
        _id: new mongoose.Types.ObjectId(),
        UID: rest.BotID,
        Password: hashedPassword
    }

    const constructedKeys: IBinanceAPIKey[] = DecryptedAPIKeys?.map((key) => {
        return {
            id: `SAGE-API-${generateID()}`,
            isDemo: key.isDemo,
            label: key.label,
            apiKey: encrypt(key.DecryptedKey),
            apiSecret: encrypt(key.DecryptedSecret)
        }
    }) || [];

    newUser.APIKeys = constructedKeys;

    const createdUser = await UserModel.create(newUser);
    const plainUser = PlainUser(createdUser.toObject());
    console.log(plainUser);
    return JSON.parse(JSON.stringify(plainUser))
}

const PlainUser = (userData: IUserInfo): IUserInfoRuntime => {
    const { APIKeys, ...plainUser } = userData;

    const dec: IDecryptedKeys[] = APIKeys.map((e) => {
        return {
            id: e.id,
            isDemo: e.isDemo,
            label: e.label,
            DecryptedKey: e.apiKey?.encrypted ? decrypt(e.apiKey!) : "",
            DecryptedSecret: e.apiSecret?.encrypted ? "*".repeat(decrypt(e.apiSecret).length) : SECRET_PLACEHOLDER,
            createdAt: e.createdAt
        }
    })
    const returnObj = {
        ...plainUser,
        DecryptedAPIKeys: dec
    }
    return returnObj
}

export const updateKillSwich = async (BotID: string, currentState: boolean): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    const session = await getSession();
    if (!session || session.user.accountType !== SUPER_USER_ROLE) return null;

    const updatedUser = await UserModel.findOneAndUpdate(
        { BotID: BotID },
        { $set: { SUKillSwitch: !currentState } },
        { new: true }
    ).select("-Password").lean();

    if (!updatedUser) return null;
    const returnObj = PlainUser(updatedUser);
    return JSON.parse(JSON.stringify(returnObj));
}

export const updateUserDemoMode = async (targetEmail: string, isDemo: boolean): Promise<IUserInfoRuntime | null> => {
    await connectDB();
    if (targetEmail.length === 0) return null;
    const session = await getSession();
    if (!session) return null;

    if (session.user.email !== targetEmail && session.user.accountType !== SUPER_USER_ROLE)
        return null;

    const updatedUser = await UserModel.findOneAndUpdate(
        { Email: targetEmail },
        { $set: { Demo: isDemo } },
        { new: true }
    ).select("-Password").lean();

    if (!updatedUser) return null;

    const response = await server({ request: "forceClose" });
    const restart = await server({ request: "restart" });
    if (!response.success) {
        const fallbackUpdate = await UserModel.findOneAndUpdate(
            { Email: targetEmail },
            { $set: { Demo: !isDemo } },
            { new: true }
        ).select("-Password").lean();
        return null;
    }

    const plainUser = PlainUser(updatedUser);
    return JSON.parse(JSON.stringify(plainUser))
}