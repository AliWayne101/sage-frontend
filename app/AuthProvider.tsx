import { SessionUser } from "@/interfaces";
import { createContext, useContext, useMemo } from "react";

type AuthContextType = {
    user: SessionUser | null;
}
interface AuthProviderProps {
    user: SessionUser | null;
    children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({
    user,
    children
}: AuthProviderProps) {
    const value = useMemo(() => ({ user }), [user]);
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}