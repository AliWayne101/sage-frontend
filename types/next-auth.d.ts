import { DefaultSession } from "next-auth";
import { SessionUser } from "@/interfaces";

declare module "next-auth" {
    interface Session {
        user: SessionUser & DefaultSession["user"];
    }

    interface User extends SessionUser { }
}

declare module "next-auth/jwt" {
    interface JWT {
        uid: string;
        accountType: string;
        email?: string | null;
        name?: string | null;
    }
}