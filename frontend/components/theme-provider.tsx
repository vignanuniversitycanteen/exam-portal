"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ThemeProvider({ children, ...props }: any) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
