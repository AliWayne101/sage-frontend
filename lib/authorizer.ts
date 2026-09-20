import { IUserInfo } from "@/schema/users";

export async function AuthorizeUser(user: IUserInfo) {
    const now = Date.now();

    if (user.LockUntil && user.LockUntil.getTime() > now) {
        return "LOC";
    }

    if (!user.IsActive) return "INA";

    return null;
}