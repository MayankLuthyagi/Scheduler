'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

// A simple icon component for the sign-in button
const LoginIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
        />
    </svg>
);


export default function InitialPage() {
    const router = useRouter();
    const { settings, isLoading } = useTheme();

    const handleGoToLogin = () => {
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 bg-white shadow-2xl rounded-xl overflow-hidden">

                {/* Content & Login Section */}
                <div className="p-8 sm:p-12 flex flex-col justify-center">

                    {/* Organization Logo */}
                    <div className="mb-6">
                        {/* This part for displaying your logo is fine */}
                        <div className="w-60 bg-white rounded flex items-center justify-center">
                            <Image
                                src="/uploads/textlogo.webp"
                                alt="Campaign Illustration"
                                className="object-contain"
                                priority
                                quality={85}
                                width={240} 
                                height={80}
                            />
                        </div>
                    </div>

                    {/* CHANGED: More professional and benefit-focused headline */}
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Streamline Your Email Outreach
                    </h1>

                    {/* CHANGED: Clearer subtext with corrected typo */}
                    <p className="text-gray-600 mb-8">
                        Welcome to the <span className="font-semibold">Schedular</span>. Please sign in to access your dashboard.
                    </p>

                    {/* CHANGED: More accurate button text */}
                    <button
                        onClick={handleGoToLogin}
                        style={{ backgroundColor: settings.themeColor }}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 text-white rounded-lg shadow-md transition-transform transform hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span>Proceed to Sign In</span>
                        <LoginIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>

                    {/* CHANGED: Slightly polished footer notice */}
                    <p className="text-xs text-gray-600 text-center mt-6">
                        This is a private system intended for authorized personnel only.
                    </p>
                </div>

                {/* Image Section */}
                <div className="hffidden md:block bg-gray-800 relative">
                    {/* This part for displaying your image is fine */}
                    <Image
                        src="/uploads/logo.webp"
                        alt="Campaign Illustration"
                        fill
                        className="object-fill"
                        priority
                        quality={85}
                        sizes="(max-width: 768px) 0vw, 50vw"
                    />
                </div>
            </div>
            {/* FOOTER — BOTTOM RIGHT */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-black text-sm">
                <Image
                    src="/assets/mayank.png"
                    alt="Mayank"
                    width={32}
                    height={32}
                    className="rounded-full opacity-80 border border-black"
                />
                <span>Made by Mayank</span>
            </div>
        </div>
    );
}