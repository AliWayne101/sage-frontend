export const AUTH_ERROR = {
    GNL: "GNL", // Google Not Linked
    LOC: "LOC", // Locked Account
    INA: "INA", // User Inactive
    ONA: "ONA", // Organization Not Active
    GLINK: "GLINK",
    LINKED: "LINKED"
} as const;
export type AuthErrorCode = keyof typeof AUTH_ERROR;
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
    GNL: "No linked account found for this Google login. Please contact support or use credentials login.",
    LOC: "Account temporarily locked for security reasons. Please wait.",
    INA: "This account is inactive. Access is restricted by administration.",
    ONA: "Organization access is disabled. Contact your system administrator.",
    LINKED: "Account is already linked",
    GLINK: "Google account has been linked",
};

export const SECRET_PLACEHOLDER = "********";
export const SUPER_USER_ROLE = "SUPER";
export const SERVER_ADDRESS = "http://localhost:3000";
export const LOAD_INTERVAL = 4000; //4 seconds