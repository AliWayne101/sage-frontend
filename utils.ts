import bcrypt from "bcrypt";
import UserModel from "./schema/users";
import { ACCOUNT_LOCK_RETRIES } from "./configs";

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