"use client";
import { ReactNode, useState } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./auth-provider";

// Create QueryClient outside component or use useState to ensure it's created only once
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1,
                staleTime: 60 * 1000, // Data considered fresh for 1 minute
                gcTime: 5 * 60 * 1000, // Cache garbage collected after 5 minutes
            },
        },
    });
}

export default function Providers({ children }: { children: ReactNode }) {
    // Use useState to ensure QueryClient is created only once per component lifecycle
    const [queryClient] = useState(() => makeQueryClient());

    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </AuthProvider>
    );
}