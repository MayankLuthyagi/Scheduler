'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        async function initAuth() {
            try {
                // Lazy load Firebase auth
                const { getFirebaseAuth } = await import('@/lib/firebase');
                const { onAuthStateChanged } = await import('firebase/auth');

                const auth = await getFirebaseAuth();

                unsubscribe = onAuthStateChanged(auth, (user) => {
                    setUser(user);
                    setLoading(false);
                });
            } catch (error) {
                console.error('Error initializing auth:', error);
                setLoading(false);
            }
        }

        initAuth();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const logout = async () => {
        try {
            // Lazy load Firebase auth for logout
            const { getFirebaseAuth } = await import('@/lib/firebase');
            const { signOut } = await import('firebase/auth');

            const auth = await getFirebaseAuth();
            await signOut(auth);

            // Clear local storage
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userPhoto');

            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        user,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};