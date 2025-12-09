"use client";
import { ReactNode } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./auth-provider";

export default function Providers({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    });

    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </AuthProvider>
    );
}