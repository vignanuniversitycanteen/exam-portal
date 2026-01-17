'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '../context/AuthContext';
import GlobalAuthLoader from './GlobalAuthLoader';

export default function ClientLayout({ children }) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <GlobalAuthLoader>
                    {children}
                </GlobalAuthLoader>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}
