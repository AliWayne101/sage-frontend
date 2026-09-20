import UserModel from "@/schema/users";
import { AuthOptions, getServerSession, Session } from "next-auth";
import bcrypt from "bcrypt";
import { connectDB } from "./mongoose";
import { handleFailedAttempt } from "@/utils";
import { SESSION_AGE } from "@/configs";
import GoogleProvider from 'next-auth/providers/google';
import { AuthorizeUser } from "./authorizer";
import { AUTH_ERROR_MESSAGES } from "@/constants";

const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            //@ts-ignore
            async authorize(credentials: any) {
                await connectDB();

                var user = await UserModel.findOne({ Email: credentials.email }).exec();
                if (!user)
                    user = await UserModel.findOne({ UID: credentials.email }).exec();

                if (!user) {
                    await bcrypt.compare(credentials.password, "$2b$10$invalidinvalidinvalidinvalidinv");
                    throw new Error("Invalid credentials.");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.PasswordHash
                );

                if (!isValid) {
                    await handleFailedAttempt(user.UID);
                    throw new Error("Invalid credentials.");
                }

                //Check activity status and lockout
                const authError = await AuthorizeUser(user);
                if (authError !== null) {
                    throw new Error(AUTH_ERROR_MESSAGES[authError]);
                }

                await UserModel.updateOne(
                    { UID: user.UID },
                    {
                        $set: { FailedAttempts: 0, LockUntil: null },
                    }
                );

                return {
                    uid: user.UID,
                    name: user.Name,
                    role: user.Role,
                    accountType: user.AccountType,
                    image: user.Image
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })
    ],
    session: {
        strategy: 'jwt',
        maxAge: SESSION_AGE
    },
    secret: process.env.NEXTAUTH_SECRET!,
    callbacks: {
        async signIn({ user, account }) {
            await connectDB();
            if (account?.provider === "google") {
                const existingUser = await UserModel.findOne({
                    ConnectedAccounts: {
                        $elemMatch: {
                            platform: "google",
                            providerAccountId: account.providerAccountId
                        }
                    }
                });

                const session = await getServerSession(authOptions);
                if (!existingUser) {
                    if (session && session.user) {
                        const dbuser = await UserModel.findOne({ UID: session.user.uid }).exec();
                        if (dbuser) {
                            const alreadyConnected = dbuser.ConnectedAccounts.find((e) => e.platform === "google");
                            if (!alreadyConnected) {
                                dbuser.ConnectedAccounts.push({
                                    platform: "google",
                                    providerAccountId: account.providerAccountId,
                                    email: user.email || "undefined",
                                    url: user.image || "default"
                                });
                                await dbuser.save();
                                return `/auth/callback?msg=GLINK&page=profile/${session.user.uid}/`;
                            }
                        }
                    }
                    return `/auth/callback?msg=GNL&page=signin`;
                } else {
                    if (session) {
                        if (existingUser.UID !== session.user.uid)
                            return `/auth/callback?msg=LINKED&page=profile/${session.user.uid}/`;
                    }
                }

                const authError = await AuthorizeUser(existingUser);

                if (authError) {
                    return `/auth/callback?msg=${authError}&page=signin`;
                }

                user.uid = existingUser.UID;
                user.role = existingUser.Role;
                user.accountType = existingUser.AccountType;
                user.image = existingUser.Image;
                user.name = existingUser.Name;

                return true;
            }

            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.uid = token.uid as string;
                session.user.role = token.role as string;
                session.user.accountType = token.accountType as string;
                session.user.image = token.image as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.uid = user.uid;
                token.name = user.name;
                token.role = user.role;
                token.accountType = user.accountType;
                token.image = user.image;
            }
            return token;
        }
    }
}

const getSession = async (): Promise<Session | null> => getServerSession(authOptions);

export { authOptions, getSession }

function CredentialsProvider(arg0: {
    id: string; name: string;
    //@ts-ignore
    authorize(credentials: any): Promise<{ uid: any; name: any; role: any; accountType: any; image: any; }>;
}): import("next-auth/providers/index").Provider {
    throw new Error("Function not implemented.");
}
