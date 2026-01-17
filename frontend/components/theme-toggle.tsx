"use client";

import * as React from "react";
import { Moon, Sun, Laptop, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-10 h-10"></div> // Place holder to prevent hydration mismatch
        )
    }

    return (
        <div className="relative group z-50">
            <button
                className="flex items-center justify-center p-2 rounded-full glass-card hover:bg-white dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
                aria-label="Toggle Theme"
            >
                {theme === 'system' ? (
                    <Monitor className="h-5 w-5" />
                ) : theme === 'dark' ? (
                    <Moon className="h-5 w-5" />
                ) : (
                    <Sun className="h-5 w-5" />
                )}
            </button>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-36 py-2 glass-card rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
                <div className="flex flex-col gap-1 p-1">
                    <button
                        onClick={() => setTheme("light")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === "light"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                            }`}
                    >
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                    </button>
                    <button
                        onClick={() => setTheme("dark")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === "dark"
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                            }`}
                    >
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                    </button>
                    <button
                        onClick={() => setTheme("system")}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${theme === "system"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                            }`}
                    >
                        <Laptop className="h-4 w-4" />
                        <span>System</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
