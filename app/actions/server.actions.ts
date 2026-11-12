"use server";

import { SERVER_ADDRESS } from "@/constants";
import { requestType } from "@/interfaces";
import { getSession } from "@/lib/nextauth";
import UserModel from "@/schema/users";

export interface DefaultResponse {
    success: boolean;
    message?: string;
}

export const server = async <T = DefaultResponse>(data: any, method: requestType = "POST"): Promise<T> => {
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

    let url = SERVER_ADDRESS;
    const fetchOptions: RequestInit = {
        method: method,
    };

    // Handle GET requests by converting data to query parameters
    if (method.toUpperCase() === "GET") {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(modData)) {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        }

        if (params.toString()) {
            url = `${SERVER_ADDRESS}?${params.toString()}`;
        }
    } else {
        // Handle methods that allow a body (POST, PUT, etc.)
        fetchOptions.headers = {
            "Content-Type": "application/json",
        };
        fetchOptions.body = JSON.stringify(modData);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    console.log(`Request to ${url} with method ${method} was successful.`);
    console.log(data);

    const result = await response.json();

    return result as T;
};