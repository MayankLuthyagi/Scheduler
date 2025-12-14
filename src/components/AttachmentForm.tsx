'use client';

import React, { useState } from 'react';
import { AttachmentFormData } from '@/types/attachment';
import { FiX, FiUploadCloud, FiLoader } from 'react-icons/fi';
import { useTheme } from '@/contexts/ThemeContext';

interface AttachmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AttachmentFormData) => Promise<void>;
}

export default function AttachmentForm({ isOpen, onClose, onSubmit }: AttachmentFormProps) {
    const [name, setName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { settings } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !file) {
            alert('Please provide both name and file');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({ name, file });
            // Reset form
            setName('');
            setFile(null);
            onClose();
        } catch (error) {
            console.error('Error submitting attachment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName('');
        setFile(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
                {/* Loading Overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
                        <div className="flex flex-col items-center space-y-3">
                            <FiLoader className="animate-spin text-4xl" style={{ color: settings.themeColor }} />
                            <p className="text-lg font-medium text-gray-700">Uploading attachment...</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Add Attachment</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Attachment Name */}
                        <div>
                            <label htmlFor="attachmentName" className="block text-sm font-medium text-gray-700 mb-1">
                                Attachment Name *
                            </label>
                            <input
                                id="attachmentName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Product Brochure"
                            />
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File *
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium hover:text-blue-500"
                                            style={{ color: settings.themeColor }}
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                                required
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PDF, PNG, JPG, CSV, XLS, DOCX up to 10MB</p>
                                </div>
                            </div>
                            {file && (
                                <div className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded">
                                    <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-6 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:bg-gray-400 cursor-pointer flex items-center justify-center"
                            style={{
                                backgroundColor: isSubmitting ? '#9CA3AF' : settings.themeColor
                            }}
                        >
                            {isSubmitting && <FiLoader className="animate-spin mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Uploading...' : 'Add Attachment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
