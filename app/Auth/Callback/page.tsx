import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";
import FullScreenLoading from "@/section/FullScreenLoading";

export default function AuthCallback() {
    return (
        <Suspense fallback={<FullScreenLoading />}>
            <AuthCallbackClient />
        </Suspense>
    );
}