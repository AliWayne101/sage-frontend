"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FullScreenLoading from "@/section/FullScreenLoading";

export default function AuthCallbackClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const error = searchParams.get("msg");
        const page = searchParams.get("page");


        if (error) {
            // signOut({ redirect: false });
            const targetPage = page?.trim() ? `/${page}` : "/";
            router.replace(`${targetPage}?msg=${encodeURIComponent(error)}`);
            return;
        }

        router.replace("/dashboard");
    }, []);

    return <FullScreenLoading />;
}