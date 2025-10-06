import Link from 'next/link';
import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    link?: string;
    linkLabel?: string;
    onClick?: () => void;
    color: 'blue' | 'green' | 'purple' | 'white';
}

const colorVariants = {
    blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        button: 'bg-blue-500 hover:bg-blue-600',
    },
    green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        button: 'bg-green-500 hover:bg-green-600',
    },
    purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-800',
        button: 'bg-purple-500 hover:bg-purple-600',
    },
    white: {
        bg: 'bg-white dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-800 dark:text-gray-100',
        button: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600',
    }
};

export default function StatCard({ title, value, icon, link, linkLabel, onClick, color }: StatCardProps) {
    const variants = colorVariants[color];

    return (
        <div className={`${variants.bg} ${variants.border} border rounded-lg p-6 shadow-sm flex flex-col justify-between`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className={`text-lg font-semibold ${variants.text}`}>{title}</h3>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-2">{value}</p>
                </div>
                {icon}
            </div>
            {(link || onClick) && linkLabel && (
                <>
                    {link ? (
                        <Link href={link} className={`mt-4 text-center text-white font-medium py-2 px-4 rounded-lg transition-colors ${variants.button}`}>
                            {linkLabel}
                        </Link>
                    ) : (
                        <button onClick={onClick} className={`mt-4 text-center text-white font-medium py-2 px-4 rounded-lg transition-colors ${variants.button}`}>
                            {linkLabel}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}