'use client';

import { useState, useEffect } from 'react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import DashboardLayout from '@/components/admin/DashboardLayout';
import { SiteSettings } from '@/types/settings';
import { FiSave } from 'react-icons/fi';
import Image from 'next/image';
export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SiteSettings>({
        themeColor: '#000000',
        themeMode: 'light',
        textLogo: undefined,
        logo: undefined,
        featureAllowed: {
            emailTemplate: false,
            emailLogs: false,
            campaign: false,
            oneTimeBroadcast: false,
            dateBasedAutomation: false,
            attachment: false,
        }
    });
    const [formData, setFormData] = useState({
        themeColor: '#000000',
        textLogo: null as File | null,
        logo: null as File | null,
        featureAllowed: {
            emailTemplate: false,
            emailLogs: false,
            campaign: false,
            oneTimeBroadcast: false,
            dateBasedAutomation: false,
            attachment: false,
        },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);



    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();

            if (data.success) {
                setSettings(data.settings);
                setFormData({
                    themeColor: data.settings.themeColor,
                    textLogo: null,
                    logo: null,
                    featureAllowed: {
                        emailTemplate: data.settings.featureAllowed?.emailTemplate ?? false,
                        emailLogs: data.settings.featureAllowed?.emailLogs ?? false,
                        campaign: data.settings.featureAllowed?.campaign ?? false,
                        oneTimeBroadcast: data.settings.featureAllowed?.oneTimeBroadcast ?? false,
                        dateBasedAutomation: data.settings.featureAllowed?.dateBasedAutomation ?? false,
                        attachment: data.settings.featureAllowed?.attachment ?? false,
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setFormData(prev => ({ ...prev, themeColor: newColor }));
        document.documentElement.style.setProperty('--theme-color', newColor);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'textLogo' | 'logo') => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.includes('webp') && !file.type.includes('png') && !file.type.includes('jpg') && !file.type.includes('jpeg')) {
                setMessage({ type: 'error', text: 'Only PNG, WEBP, JPG, and JPEG files are allowed' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setMessage({ type: 'error', text: 'File size must be less than 5MB' });
                return;
            }
            setFormData(prev => ({ ...prev, [type]: file }));
            setMessage(null);
        }
    };

    const handleFeatureToggle = (feature: keyof typeof formData.featureAllowed) => {
        setFormData(prev => ({
            ...prev,
            featureAllowed: {
                ...prev.featureAllowed,
                [feature]: !prev.featureAllowed[feature],
            }
        }));
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const submitFormData = new FormData();
            submitFormData.append('themeColor', formData.themeColor);
            // Always send a valid themeMode to satisfy backend validation
            submitFormData.append('themeMode', 'light');

            if (formData.textLogo) {
                submitFormData.append('textLogo', formData.textLogo);
            }
            if (formData.logo) {
                submitFormData.append('logo', formData.logo);
            }

            // Append feature allowed data
            submitFormData.append('emailTemplate', String(formData.featureAllowed.emailTemplate));
            submitFormData.append('emailLogs', String(formData.featureAllowed.emailLogs));
            submitFormData.append('campaign', String(formData.featureAllowed.campaign));
            submitFormData.append('oneTimeBroadcast', String(formData.featureAllowed.oneTimeBroadcast));
            submitFormData.append('dateBasedAutomation', String(formData.featureAllowed.dateBasedAutomation));
            submitFormData.append('attachment', String(formData.featureAllowed.attachment));

            const response = await fetch('/api/settings', {
                method: 'POST',
                body: submitFormData
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                setSettings(data.settings);
                setFormData(prev => ({ ...prev, textLogo: null, logo: null }));

                const textLogoInput = document.getElementById('textLogo') as HTMLInputElement;
                const logoInput = document.getElementById('logo') as HTMLInputElement;
                if (textLogoInput) textLogoInput.value = '';
                if (logoInput) logoInput.value = '';

                setTimeout(() => window.location.reload(), 1000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update settings' });
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminProtectedRoute>
                <DashboardLayout>
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                        <div className="space-y-6">
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </DashboardLayout>
            </AdminProtectedRoute>
        );
    }

    return (
        <AdminProtectedRoute>
            <DashboardLayout>
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Settings</h1>

                    {message && (
                        <div className={`mb-4 p-3 rounded-md text-sm ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-theme">

                            {/* Site Theme Section Header */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Site Theme</h3>
                            </div>

                            {/* Theme Color */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium text-black mb-2">
                                    Theme Color
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        id="themeColor"
                                        value={formData.themeColor}
                                        onChange={handleColorChange}
                                        className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.themeColor}
                                        onChange={(e) => setFormData(prev => ({ ...prev, themeColor: e.target.value }))}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 transition-theme"
                                        style={{ '--tw-ring-color': formData.themeColor } as React.CSSProperties}
                                        placeholder="#3b82f6"
                                    />
                                </div>
                            </div>

                            {/* Theme Mode removed */}

                            {/* Main Logo */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium text-black mb-2">
                                    Main Logo
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="file"
                                        id="logo"
                                        accept=".png, .webp, .jpg, .jpeg"
                                        onChange={(e) => handleFileChange(e, 'logo')}
                                        className="block flex-1 text-xs text-gray-600 dark:text-gray-400 
                                            file:mr-3 file:py-2 file:px-3 
                                            file:rounded file:border-0 
                                            file:text-xs file:font-medium 
                                            file:bg-gray-50 dark:file:bg-gray-900/30 
                                            file:text-black dark:file:text-white
                                            hover:file:bg-gray-100 dark:hover:file:bg-gray-900/50 
                                            file:cursor-pointer cursor-pointer"
                                    />
                                    {settings.logo && (
                                        <Image src={`/uploads/${settings.logo}?t=${Date.now()}`} alt="Logo" width={100} height={32} className="h-8 object-contain" />
                                    )}
                                </div>
                            </div>

                            {/* Text Logo */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-medium text-black mb-2">
                                    Text Logo
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="file"
                                        id="textLogo"
                                        accept=".png, .webp, .jpg, .jpeg"
                                        onChange={(e) => handleFileChange(e, 'textLogo')}
                                        className="block flex-1 text-xs text-gray-600 dark:text-gray-400 
                                            file:mr-3 file:py-2 file:px-3 
                                            file:rounded file:border-0 
                                            file:text-xs file:font-medium 
                                            file:bg-gray-50 dark:file:bg-gray-900/30 
                                            file:text-black dark:file:text-white
                                            hover:file:bg-gray-100 dark:hover:file:bg-gray-900/50 
                                            file:cursor-pointer cursor-pointer"
                                    />
                                    {settings.textLogo && (
                                        <Image src={`/uploads/${settings.textLogo}?t=${Date.now()}`} alt="Text Logo" width={100} height={32} className="h-8 object-contain" />
                                    )}
                                </div>
                            </div>

                            {/* Features Section Header */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Features</h3>
                            </div>

                            {/* Email Template Toggle */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label htmlFor="emailTemplate-toggle" className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-black">Email Template</span>
                                    <div className="relative">
                                        <input
                                            id="emailTemplate-toggle"
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.featureAllowed?.emailTemplate ?? false}
                                            onChange={() => handleFeatureToggle('emailTemplate')}
                                        />
                                        <div
                                            className={`block w-12 h-6 rounded-full transition-colors ${formData.featureAllowed?.emailTemplate ? '' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={formData.featureAllowed?.emailTemplate ? { backgroundColor: formData.themeColor } : {}}
                                        ></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featureAllowed?.emailTemplate ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {/* User Analytics Toggle */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label htmlFor="emailLogs-toggle" className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-black">User Analytics</span>
                                    <div className="relative">
                                        <input
                                            id="emailLogs-toggle"
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.featureAllowed?.emailLogs ?? false}
                                            onChange={() => handleFeatureToggle('emailLogs')}
                                        />
                                        <div
                                            className={`block w-12 h-6 rounded-full transition-colors ${formData.featureAllowed?.emailLogs ? '' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={formData.featureAllowed?.emailLogs ? { backgroundColor: formData.themeColor } : {}}
                                        ></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featureAllowed?.emailLogs ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {/* Campaign Toggle */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label htmlFor="campaign-toggle" className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-black">Campaign</span>
                                    <div className="relative">
                                        <input
                                            id="campaign-toggle"
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.featureAllowed?.campaign ?? false}
                                            onChange={() => handleFeatureToggle('campaign')}
                                        />
                                        <div
                                            className={`block w-12 h-6 rounded-full transition-colors ${formData.featureAllowed?.campaign ? '' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={formData.featureAllowed?.campaign ? { backgroundColor: formData.themeColor } : {}}
                                        ></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featureAllowed?.campaign ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {/* One-Time Broadcast Toggle */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label htmlFor="oneTimeBroadcast-toggle" className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-black">One-Time Broadcast</span>
                                    <div className="relative">
                                        <input
                                            id="oneTimeBroadcast-toggle"
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.featureAllowed?.oneTimeBroadcast ?? false}
                                            onChange={() => handleFeatureToggle('oneTimeBroadcast')}
                                        />
                                        <div
                                            className={`block w-12 h-6 rounded-full transition-colors ${formData.featureAllowed?.oneTimeBroadcast ? '' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={formData.featureAllowed?.oneTimeBroadcast ? { backgroundColor: formData.themeColor } : {}}
                                        ></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featureAllowed?.oneTimeBroadcast ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {/* Date-Based Automation Toggle */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label htmlFor="dateBasedAutomation-toggle" className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-black">Date-Based Automation</span>
                                    <div className="relative">
                                        <input
                                            id="dateBasedAutomation-toggle"
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.featureAllowed?.dateBasedAutomation ?? false}
                                            onChange={() => handleFeatureToggle('dateBasedAutomation')}
                                        />
                                        <div
                                            className={`block w-12 h-6 rounded-full transition-colors ${formData.featureAllowed?.dateBasedAutomation ? '' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={formData.featureAllowed?.dateBasedAutomation ? { backgroundColor: formData.themeColor } : {}}
                                        ></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featureAllowed?.dateBasedAutomation ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {/* Attachment Toggle */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <label htmlFor="attachment-toggle" className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-medium text-black">Attachment</span>
                                    <div className="relative">
                                        <input
                                            id="attachment-toggle"
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.featureAllowed?.attachment ?? false}
                                            onChange={() => handleFeatureToggle('attachment')}
                                        />
                                        <div
                                            className={`block w-12 h-6 rounded-full transition-colors ${formData.featureAllowed?.attachment ? '' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={formData.featureAllowed?.attachment ? { backgroundColor: formData.themeColor } : {}}
                                        ></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.featureAllowed?.attachment ? 'transform translate-x-6' : ''}`}></div>
                                    </div>
                                </label>
                            </div>

                            {/* Save Button */}
                            <div className="p-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ backgroundColor: formData.themeColor }}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave className="mr-2" size={16} />
                                            Save Settings
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </AdminProtectedRoute>
    );
}
