'use client';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { API_BASE_URL } from '../utils/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('studentUser');
            const token = localStorage.getItem('studentToken');

            if (token) {
                // Optimistically set user from storage if available
                if (storedUser) setUser(JSON.parse(storedUser));

                try {
                    // Verify with backend and get fresh data including profileComplete status
                    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const freshUser = await res.json();
                        setUser(freshUser);
                        localStorage.setItem('studentUser', JSON.stringify(freshUser));
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        console.error("Auth check failed with status:", res.status, errorData);
                        logout();
                    }
                } catch (err) {
                    console.error("Auth check network error:", err.message);
                }
            }

            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = useCallback((userData, token, isNew = false) => {
        setUser(userData);
        localStorage.setItem('studentUser', JSON.stringify(userData));
        localStorage.setItem('studentToken', token);

        // Primary redirection logic:
        // If profile is incomplete, force them to completion page.
        // If profile is complete, send them to dashboard.
        if (userData.is_profile_complete === false) {
            router.push('/student/complete-profile');
        } else {
            router.push('/');
        }
    }, [router]);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('studentUser');
        localStorage.removeItem('studentToken');
        router.push('/student/login');
    }, [router]);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout
    }), [user, loading, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
