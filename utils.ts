import bcrypt from "bcrypt";
import UserModel, { IUserInfo } from "./schema/users";
import { ACCOUNT_LOCK_RETRIES } from "./configs";

export function formatCurrency(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

export function formatPercent(value: number, decimals: number = 2): string {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(decimals)}%`;
}


export async function HashPassword(password: string) {
    return bcrypt.hash(password, 12);
}

export async function handleFailedAttempt(uid: string) {
    return await UserModel.findOneAndUpdate(
        { UID: uid },
        [
            {
                $set: {
                    FailedAttempts: {
                        $add: ["$FailedAttempts", 1]
                    }
                }
            },
            {
                $set: {
                    LockUntil: {
                        $cond: [
                            {
                                $gte: [
                                    { $add: ["$FailedAttempts", 1] },
                                    ACCOUNT_LOCK_RETRIES
                                ]
                            },
                            new Date(Date.now() + 15 * 60 * 1000),
                            "$LockUntil"
                        ]
                    }
                }
            }
        ],
        {
            new: true,
            updatePipeline: true
        }
    );
}

export interface IUserInfoRuntime extends IUserInfo {
    DecryptedKey: string;
    DecryptedSecret: string;
}