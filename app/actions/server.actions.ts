"use server";

import { SERVER_ADDRESS } from "@/constants";
import { getSession } from "@/lib/nextauth";
import UserModel from "@/schema/users";

export interface DefaultResponse {
    success: boolean;
    message?: string;
}

export const server = async <T = DefaultResponse>(data: any): Promise<T> => {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    const user = await UserModel.findOne({
        Email: session.user.email
    }).lean();

    if (!user) {
        throw new Error("User not found");
    }

    const modData = {
        ...data,
        BotID: user.BotID
    };

    const response = await fetch(SERVER_ADDRESS, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(modData),
    });

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    const result = await response.json();

    return result as T;
};