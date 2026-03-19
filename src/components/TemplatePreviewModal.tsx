import { Campaign } from '@/types/campaign'; // Adjust the import path as needed
import { FiEye, FiX } from 'react-icons/fi';

interface TemplatePreviewModalProps {
    campaign: Campaign;
    onClose: () => void;
}

const TemplatePreviewModal = ({ campaign, onClose }: TemplatePreviewModalProps) => {
    // Safely extract the email body, providing a fallback if it's somehow empty
    const htmlString = campaign.emailBody || "<div style='text-align:center; padding: 40px; font-family: sans-serif; color: #666;'>No HTML template data found for this campaign.</div>";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 sm:p-6 transition-opacity">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden relative">
                
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-3">
             
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                {campaign.campaignName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Subject: {campaign.emailSubject || '(No Subject)'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Close Preview"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Iframe Container - Styled to look like an email client wrapper */}
                <div className="flex-1 bg-gray-100 p-4 sm:p-8 overflow-hidden relative flex justify-center">
                    <div className="w-full max-w-[800px] h-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
                        {/* srcDoc renders the raw HTML string directly within the isolated iframe */}
                        <iframe
                            srcDoc={htmlString}
                            title={`Preview of ${campaign.campaignName}`}
                            className="w-full h-full absolute inset-0 border-none bg-white"
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TemplatePreviewModal; // You can export this if you place it in a separate file