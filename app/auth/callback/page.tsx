'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/app/context/UserContext';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { updateUser } = useUser();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const next = searchParams.get('next') || '/jarvis';

            if (code) {
                try {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) throw error;

                    if (data.session && data.user) {
                        const user = data.user;
                        const token = data.session.access_token;

                        // Map metadata
                        const storedUser = {
                            ...user,
                            name: user.user_metadata?.full_name || user.email?.split('@')[0],
                            authenticated: true
                        };

                        // Persistence
                        localStorage.setItem("race_ai_user", JSON.stringify(storedUser));
                        localStorage.setItem("race_ai_token", token);

                        updateUser(storedUser);
                        router.push(next);
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to verify email.');
                }
            } else {
                // No code, maybe check for hash or just redirect if already logged in?
                // For now, if no code, assume error or direct navigation
                setError('No verification code found.');
            }
        };

        handleCallback();
    }, [router, searchParams, updateUser]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <div className="p-8 rounded-lg border border-red-200 bg-red-50 text-red-900">
                    <h2 className="text-lg font-bold mb-2">Verification Failed</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-medium text-foreground">Verifying your email...</h2>
                <p className="text-muted-foreground">Please wait while we log you in.</p>
            </div>
        </div>
    );
}
