'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller, UseFormRegister } from 'react-hook-form';
import { CampaignFormData, Campaign } from '@/types/campaign';
import { FiX, FiUploadCloud, FiTrash2, FiLoader, FiBold, FiItalic, FiCode } from 'react-icons/fi';
import { createEditor, Descendant, Editor, Text } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { useTheme } from '@/contexts/ThemeContext';
// --- Slate.js Type Definitions ---
type LinkElement = { type: 'link'; url: string; children: CustomText[] };
type ListItemElement = { type: 'list-item'; children: (CustomText | LinkElement)[] };
type BulletedListElement = { type: 'bulleted-list'; children: ListItemElement[] };
type NumberedListElement = { type: 'numbered-list'; children: ListItemElement[] };
type ParagraphElement = { type: 'paragraph'; children: (CustomText | LinkElement)[] };
type CustomElement = ParagraphElement | LinkElement | ListItemElement | BulletedListElement | NumberedListElement;
type CustomText = { text: string; bold?: true; italic?: true; code?: true; underline?: true };

interface RenderLeafProps {
    attributes: Record<string, unknown>;
    children: React.ReactNode;
    leaf: CustomText;
}

interface RenderElementProps {
    attributes: Record<string, unknown>;
    children: React.ReactNode;
    element: CustomElement;
}

declare module 'slate' {
    interface CustomTypes {
        Editor: ReactEditor & { type?: string };
        Element: CustomElement;
        Text: CustomText;
    }
}

// --- Slate.js Editor Component ---
const initialSlateValue: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] }];

// Helper function to serialize Slate nodes to an HTML string
const serializeSlateToHTML = (nodes: Descendant[]): string => {
    return nodes.map(node => {
        if (Text.isText(node)) {
            let html = node.text;
            if (node.bold) html = `<strong>${html}</strong>`;
            if (node.italic) html = `<em>${html}</em>`;
            if (node.code) html = `<code>${html}</code>`;
            if (node.underline) html = `<u>${html}</u>`;
            return html;
        }

        const children = serializeSlateToHTML(node.children);
        switch (node.type) {
            case 'paragraph':
                return `<p>${children}</p>`;
            case 'link':
                return `<a href="${node.url}" target="_blank" rel="noopener noreferrer">${children}</a>`;
            case 'bulleted-list':
                return `<ul>${children}</ul>`;
            case 'numbered-list':
                return `<ol>${children}</ol>`;
            case 'list-item':
                return `<li>${children}</li>`;
            default:
                return children;
        }
    }).join('');
};

// Helper function to deserialize an HTML string to Slate nodes
const deserializeHTMLToSlate = (html: string): Descendant[] => {
    if (!html) return initialSlateValue;

    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const body = parsed.body;

    const deserialize = (el: Node, parentMarks: Partial<CustomText> = {}): (Descendant | CustomText | LinkElement)[] => {
        if (el.nodeType === Node.TEXT_NODE) {
            if (!el.textContent) return [];
            return [{ text: el.textContent, ...parentMarks }];
        }

        if (el.nodeType !== Node.ELEMENT_NODE) {
            return [];
        }

        const element = el as HTMLElement;
        const nodeName = element.nodeName;

        // Start fresh - don't automatically inherit all parent marks
        // Only inherit marks for inline formatting elements
        let currentMarks: Partial<CustomText> = {};

        // For formatting elements, inherit parent marks and add new ones
        const isFormattingElement = ['STRONG', 'B', 'EM', 'I', 'U', 'CODE', 'SPAN', 'A'].includes(nodeName);
        if (isFormattingElement) {
            currentMarks = { ...parentMarks };
        }

        // Handle marks (formatting) from semantic HTML
        switch (nodeName) {
            case 'STRONG':
            case 'B':
                currentMarks.bold = true;
                break;
            case 'EM':
            case 'I':
                currentMarks.italic = true;
                break;
            case 'U':
                currentMarks.underline = true;
                break;
            case 'CODE':
                currentMarks.code = true;
                break;
        }

        // Check for inline styles (Google Docs often uses these on SPAN elements)
        if (nodeName === 'SPAN') {
            const style = element.style;
            if (style && style.fontWeight) {
                const fontWeight = style.fontWeight;
                const numericWeight = parseInt(fontWeight);
                // Only apply bold if font-weight is >= 600 (semi-bold or bold)
                // Normal weight is 400, bold is 700
                if (fontWeight === 'bold' || (!isNaN(numericWeight) && numericWeight >= 600)) {
                    currentMarks.bold = true;
                }
            }
            if (style && style.fontStyle === 'italic') {
                currentMarks.italic = true;
            }
            if (style && style.textDecoration && style.textDecoration.includes('underline')) {
                currentMarks.underline = true;
            }
        }

        // Process children with the current marks
        const children = Array.from(element.childNodes)
            .flatMap(child => deserialize(child, currentMarks))
            .flat();

        // Handle block elements
        switch (nodeName) {
            case 'BODY':
            case 'HTML':
                return children;
            case 'BR':
                return [{ text: '\n' }];
            case 'P':
            case 'DIV':
            case 'H1':
            case 'H2':
            case 'H3':
            case 'H4':
            case 'H5':
            case 'H6': {
                const paragraphChildren = children.length > 0
                    ? children.filter((child): child is CustomText | LinkElement =>
                        Text.isText(child) || (typeof child === 'object' && 'type' in child && child.type === 'link')
                    )
                    : [{ text: '' }];
                return [{ type: 'paragraph', children: paragraphChildren }];
            }
            case 'UL': {
                const listItems = children.filter((child): child is ListItemElement =>
                    !Text.isText(child) && typeof child === 'object' && 'type' in child && child.type === 'list-item'
                );
                if (listItems.length === 0) return [];
                return [{ type: 'bulleted-list', children: listItems }];
            }
            case 'OL': {
                const listItems = children.filter((child): child is ListItemElement =>
                    !Text.isText(child) && typeof child === 'object' && 'type' in child && child.type === 'list-item'
                );
                if (listItems.length === 0) return [];
                return [{ type: 'numbered-list', children: listItems }];
            }
            case 'LI': {
                // For list items, we want to extract all inline content (text and links)
                // but flatten any nested block elements
                const extractInlineContent = (nodes: (Descendant | CustomText | LinkElement)[]): (CustomText | LinkElement)[] => {
                    const result: (CustomText | LinkElement)[] = [];

                    for (const node of nodes) {
                        if (Text.isText(node)) {
                            result.push(node);
                        } else if (typeof node === 'object' && 'type' in node) {
                            if (node.type === 'link') {
                                result.push(node as LinkElement);
                            } else if (node.type === 'paragraph' && 'children' in node) {
                                // Extract children from nested paragraphs
                                result.push(...extractInlineContent(node.children));
                            } else if ('children' in node) {
                                // For other block elements, extract their inline content
                                result.push(...extractInlineContent(node.children));
                            }
                        }
                    }

                    return result;
                };

                const inlineContent = extractInlineContent(children);
                const listItemChildren = inlineContent.length > 0 ? inlineContent : [{ text: '' }];

                return [{ type: 'list-item', children: listItemChildren }];
            }
            case 'A': {
                const href = element.getAttribute('href') || '';
                const linkChildren = children.filter(Text.isText);
                if (linkChildren.length === 0) {
                    linkChildren.push({ text: element.textContent || '', ...currentMarks });
                }
                return [{ type: 'link', url: href, children: linkChildren }];
            }
            case 'SPAN':
            case 'STRONG':
            case 'B':
            case 'EM':
            case 'I':
            case 'U':
            case 'CODE':
                return children;
            default:
                // For unknown elements, just return their children
                return children;
        }
    };

    const result = deserialize(body);

    // Filter to get only valid Descendant nodes
    const nodes = result.filter((node): node is Descendant =>
        !Text.isText(node) && typeof node === 'object' && 'type' in node && 'children' in node
    );

    // Ensure we have at least one valid paragraph with proper structure
    if (nodes.length === 0) {
        return initialSlateValue;
    }

    // Validate each node has children
    const validNodes = nodes.map(node => {
        if (!Text.isText(node) && 'type' in node) {
            if (node.type === 'paragraph') {
                const paragraphNode = node as ParagraphElement;
                const children = paragraphNode.children.filter((child: CustomText | LinkElement): child is CustomText | LinkElement =>
                    Text.isText(child) || (typeof child === 'object' && 'type' in child && child.type === 'link')
                );
                return {
                    ...paragraphNode,
                    children: children.length > 0 ? children : [{ text: '' }]
                } as Descendant;
            } else if (node.type === 'bulleted-list' || node.type === 'numbered-list') {
                const listNode = node as BulletedListElement | NumberedListElement;
                return listNode.children.length > 0 ? node : null;
            } else if (node.type === 'list-item') {
                const listItemNode = node as ListItemElement;
                const children = listItemNode.children.filter((child: CustomText | LinkElement): child is CustomText | LinkElement =>
                    Text.isText(child) || (typeof child === 'object' && 'type' in child && child.type === 'link')
                );
                return {
                    ...listItemNode,
                    children: children.length > 0 ? children : [{ text: '' }]
                } as Descendant;
            }
        }
        return node;
    }).filter((node): node is Descendant => node !== null);

    return validNodes;
};


const MarkButton = ({ format, icon }: { format: 'bold' | 'italic' | 'code'; icon: React.ReactNode }) => {
    const editor = useSlate();
    const { settings } = useTheme();
    const isMarkActive = (editor: Editor, format: string) => {
        const marks = Editor.marks(editor);
        return marks ? marks[format as keyof Omit<CustomText, 'text'>] === true : false;
    };

    return (
        <button
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
                if (isMarkActive(editor, format)) {
                    Editor.removeMark(editor, format);
                } else {
                    Editor.addMark(editor, format, true);
                }
            }}
            className={`px-2 py-1 border rounded hover:bg-gray-200 ${isMarkActive(editor, format) ? 'text-white' : 'bg-white'
                }`}
            style={{
                backgroundColor: isMarkActive(editor, format) ? settings.themeColor : 'white'
            }}
        >
            {icon}
        </button>
    );
};

const SlateEditor = ({ value, onChange, editorKey }: { value: Descendant[]; onChange: (value: Descendant[]) => void; editorKey?: string; }) => {
    const editor = useMemo(() => {
        const e = withHistory(withReact(createEditor()));

        // Customize the editor to treat links as inline elements
        const { isInline, normalizeNode } = e;
        e.isInline = (element) => {
            return element.type === 'link' ? true : isInline(element);
        };

        // Ensure the editor always has at least one paragraph
        e.normalizeNode = (entry) => {
            const [node, path] = entry;

            // If the editor is empty, insert an empty paragraph
            if (path.length === 0) {
                if (editor.children.length === 0) {
                    const paragraph: CustomElement = { type: 'paragraph', children: [{ text: '' }] };
                    editor.children.push(paragraph);
                    return;
                }
            }

            normalizeNode(entry);
        };

        return e;
    }, []);

    const renderLeaf = useCallback((props: RenderLeafProps) => {
        let children = props.children;
        if (props.leaf.bold) children = <strong>{children}</strong>;
        if (props.leaf.italic) children = <em>{children}</em>;
        if (props.leaf.code) children = <code>{children}</code>;
        if (props.leaf.underline) children = <u>{children}</u>;
        return <span {...props.attributes}>{children}</span>;
    }, []);

    const renderElement = useCallback((props: RenderElementProps) => {
        const { attributes, children, element } = props;
        switch (element.type) {
            case 'link':
                return (
                    <a
                        {...attributes}
                        href={element.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                    >
                        {children}
                    </a>
                );
            case 'bulleted-list':
                return <ul {...attributes} className="list-disc list-inside ml-4">{children}</ul>;
            case 'numbered-list':
                return <ol {...attributes} className="list-decimal list-inside ml-4">{children}</ol>;
            case 'list-item':
                return <li {...attributes}>{children}</li>;
            case 'paragraph':
            default:
                return <p {...attributes}>{children}</p>;
        }
    }, []);

    const editorValue = useMemo(() => {
        // Ensure we always have a valid structure
        if (!value || value.length === 0) {
            return initialSlateValue;
        }

        // Validate that all elements are proper Descendants
        const validValue = value.filter((node): node is Descendant =>
            !Text.isText(node) && typeof node === 'object' && 'type' in node && 'children' in node
        );

        return validValue.length > 0 ? validValue : initialSlateValue;
    }, [value]);

    // Handle paste event to preserve HTML formatting
    const handlePaste = useCallback((event: React.ClipboardEvent) => {
        event.preventDefault();
        const html = event.clipboardData.getData('text/html');

        if (html) {
            try {
                // Parse the HTML content
                const fragment = deserializeHTMLToSlate(html);

                if (fragment && fragment.length > 0) {
                    // Ensure the editor has a valid selection
                    const { selection } = editor;

                    if (!selection) {
                        // If no selection, create one at the start
                        const point = { path: [0, 0], offset: 0 };
                        editor.selection = { anchor: point, focus: point };
                    }

                    // Insert the fragment at the current selection
                    Editor.insertFragment(editor, fragment);
                }
            } catch (error) {
                console.error('Error pasting HTML:', error);
                // Fallback to plain text if HTML parsing fails
                const text = event.clipboardData.getData('text/plain');
                if (text) {
                    Editor.insertText(editor, text);
                }
            }
        } else {
            // Fallback to plain text if no HTML
            const text = event.clipboardData.getData('text/plain');
            if (text) {
                Editor.insertText(editor, text);
            }
        }
    }, [editor]);

    return (
        <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
            <Slate
                key={`${editorKey}-${JSON.stringify(editorValue)}`}
                editor={editor}
                initialValue={editorValue}
                onValueChange={onChange}
            >
                <div className="border-b p-2 flex gap-2 bg-gray-50">
                    <MarkButton format="bold" icon={<FiBold />} />
                    <MarkButton format="italic" icon={<FiItalic />} />
                    <MarkButton format="code" icon={<FiCode />} />
                </div>
                <Editable
                    renderLeaf={renderLeaf}
                    renderElement={renderElement}
                    className="p-3 min-h-[300px] focus:outline-none"
                    placeholder="Write your email content here..."
                    onPaste={handlePaste}
                />
            </Slate>
        </div>
    );
};


// --- Custom Hook for Fetching Data ---
const useAuthEmails = (isOpen: boolean) => {
    // ... (rest of the hook is unchanged)
    const [authEmails, setAuthEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (!isOpen) return;
        const fetchEmails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/authEmails`);
                if (!response.ok) throw new Error("Failed to fetch sender emails.");
                const data = await response.json();
                if (data.success && Array.isArray(data.emails)) {
                    const emailAddresses = data.emails.map((emailObj: { email: string }) => emailObj.email);
                    setAuthEmails(emailAddresses);
                }
            } catch (error) {
                console.error('Error fetching auth emails:', error);
                setAuthEmails([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmails();
    }, [isOpen]);
    return { authEmails, isLoading };
};


// --- Main Campaign Form Component ---
interface CampaignFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CampaignFormData, isEdit?: boolean) => void;
    editCampaign?: Campaign | null;
}

type Tab = 'content' | 'scheduling' | 'sending';

export default function CampaignForm({ isOpen, onClose, onSubmit, editCampaign }: CampaignFormProps) {
    const [activeTab, setActiveTab] = useState<Tab>('content');
    const { authEmails, isLoading: emailsLoading } = useAuthEmails(isOpen);
    const { settings } = useTheme();

    type SlateFormValues = Omit<CampaignFormData, 'emailBody'> & {
        emailBody: Descendant[];
    };
    // Default values now use Slate's format for emailBody
    const defaultValues = useMemo<SlateFormValues>(() => ({
        campaignName: '',
        emailSubject: '',
        emailBody: initialSlateValue,
        commaId: [],
        startDate: '',
        endDate: '',
        sendTime: '',
        sendDays: [],
        dailySendLimitPerSender: 10,
        sendMethod: 'one-on-one',
        toEmail: '',
        replyToEmail: '',
        sheetId: '',
        attachment: null,
        attachmentNote: '',
        isActive: true,
    }), []);

    // Note the updated type for emailBody
    const { register, handleSubmit, control, watch, reset, formState: { isSubmitting } } = useForm<SlateFormValues>({
        defaultValues,
    });

    // Populate form with data when editing
    useEffect(() => {
        if (editCampaign) {
            const processedEditData: SlateFormValues = {
                campaignName: editCampaign.campaignName || '',
                emailSubject: editCampaign.emailSubject || '',
                emailBody: deserializeHTMLToSlate(editCampaign.emailBody || ''),
                commaId: editCampaign.commaId || [],
                startDate: editCampaign.startDate || '',
                endDate: editCampaign.endDate || '',
                sendTime: editCampaign.sendTime || '',
                sendDays: editCampaign.sendDays || [],
                dailySendLimitPerSender: editCampaign.dailySendLimitPerSender || 10,
                sendMethod: editCampaign.sendMethod || 'one-on-one',
                toEmail: editCampaign.toEmail || '',
                replyToEmail: editCampaign.replyToEmail || '',
                sheetId: editCampaign.sheetId || '',
                attachment: null, // Always null since we can't pre-populate file inputs
                attachmentNote: editCampaign.attachments?.[0]?.note || '',
                isActive: editCampaign.isActive !== undefined ? editCampaign.isActive : true,
            };
            reset(processedEditData);
        } else {
            reset(defaultValues);
        }
    }, [editCampaign, reset, defaultValues]);


    const handleFormSubmit = (data: SlateFormValues) => {
        // Serialize Slate's format to HTML before submitting
        const processedData: CampaignFormData = {
            ...data,
            emailBody: serializeSlateToHTML(data.emailBody),
        };
        onSubmit(processedData, !!editCampaign);
    };

    // ... (rest of the component is largely unchanged)
    const sendMethod = watch('sendMethod');

    if (!isOpen) return null;

    const TabButton = ({ tab, label }: { tab: Tab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-200'
                }`}
            style={{
                backgroundColor: activeTab === tab ? settings.themeColor : 'transparent'
            }}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col" key={editCampaign?.campaignId || 'new-campaign'}>
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {editCampaign ? 'Edit Campaign' : 'Create New Campaign'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition cursor-pointer">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-grow overflow-y-auto">
                    <div className="p-6">
                        {/* Tabs */}
                        <div className="flex space-x-2 border-b mb-6 pb-4">
                            <TabButton tab="content" label="1. Content" />
                            <TabButton tab="scheduling" label="2. Scheduling" />
                            <TabButton tab="sending" label="3. Sending" />
                        </div>

                        <div className="space-y-6">
                            {/* --- CONTENT TAB --- */}
                            {activeTab === 'content' && (
                                <div className="space-y-6 animate-fade-in">
                                    <FormInput label="Campaign Name" name="campaignName" register={register} required />
                                    <FormInput label="Email Subject" name="emailSubject" register={register} required />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                                        <Controller
                                            name="emailBody"
                                            control={control}
                                            rules={{
                                                validate: value => (value && serializeSlateToHTML(value) !== '<p></p>') || 'Email body cannot be empty.'
                                            }}
                                            render={({ field }) => (
                                                <SlateEditor
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    editorKey={editCampaign?.campaignId || 'new-campaign'}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* --- SCHEDULING TAB --- */}
                            {activeTab === 'scheduling' && (
                                // ... (unchanged)
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="Start Date" name="startDate" type="date" register={register} required />
                                        <FormInput label="End Date" name="endDate" type="date" register={register} required />
                                    </div>
                                    <FormInput label="Send Time" name="sendTime" type="time" register={register} required />
                                    <Controller
                                        name="sendDays"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => <ToggleButtonGroup label="Send on Days" options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']} value={field.value} onChange={field.onChange} />}
                                    />
                                    <FormInput label="Daily Send Limit (per Sender)" name="dailySendLimitPerSender" type="number" register={register} required min="1" />
                                </div>
                            )}

                            {/* --- SENDING TAB --- */}
                            {activeTab === 'sending' && (
                                // ... (unchanged)
                                <div className="space-y-6 animate-fade-in">
                                    {emailsLoading ? <p>Loading emails...</p> : (
                                        <Controller
                                            name="commaId"
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <ToggleButtonGroup
                                                    key={editCampaign?.campaignId || 'new'}
                                                    label="Send From Emails"
                                                    options={authEmails}
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormSelect
                                            key={`sendMethod-${editCampaign?.campaignId || 'new'}`}
                                            label="Send Method"
                                            name="sendMethod"
                                            register={register}
                                            required
                                            options={[
                                                { value: 'one-on-one', label: 'One on One' },
                                                { value: 'cc', label: 'CC' },
                                                { value: 'bcc', label: 'BCC' }
                                            ]}
                                        />
                                        {(sendMethod === 'cc' || sendMethod === 'bcc') && (
                                            <FormInput
                                                key={`toEmail-${editCampaign?.campaignId || 'new'}`}
                                                label="Recipient 'To' Address"
                                                name="toEmail"
                                                register={register}
                                                required
                                            />
                                        )}
                                    </div>
                                    <FormInput
                                        key={`replyToEmail-${editCampaign?.campaignId || 'new'}`}
                                        label="Reply-To Address"
                                        name="replyToEmail"
                                        type="email"
                                        register={register}
                                        required
                                    />
                                    <FormInput
                                        key={`sheetId-${editCampaign?.campaignId || 'new'}`}
                                        label="Google Sheet ID"
                                        name="sheetId"
                                        register={register}
                                        placeholder="Optional: Enter Google Sheet ID"
                                    />
                                    <Controller
                                        name="attachment"
                                        control={control}
                                        render={({ field: { onChange } }) => (
                                            <div key={`attachment-${editCampaign?.campaignId || 'new'}`}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                                    <div className="space-y-1 text-center">
                                                        <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600">
                                                            <label htmlFor="attachment-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                                <span>Upload a file</span>
                                                                <input id="attachment-upload" name="attachment-upload" type="file" className="sr-only" onChange={e => onChange(e.target.files?.[0] ?? null)} />
                                                            </label>
                                                            <p className="pl-1">or drag and drop</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PDF, PNG, JPG, CSV, XLS up to 10MB</p>
                                                    </div>
                                                </div>
                                                {watch('attachment') && <div className="mt-2 text-sm text-gray-700 flex items-center justify-between bg-gray-100 p-2 rounded"><span>{watch('attachment')?.name}</span> <button type="button" onClick={() => onChange(null)}><FiTrash2 className="text-red-500" /></button></div>}
                                                {editCampaign && editCampaign.attachments?.length > 0 && !watch('attachment') && (
                                                    <div className="mt-2 text-sm text-blue-600">
                                                        Existing attachment: {editCampaign.attachments[0].filename}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="h-4 w-4 border-gray-300 rounded focus:ring-2"
                                        style={{
                                            accentColor: settings.themeColor
                                        }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Campaign is Active</span>
                                </label>
                            )}
                        />
                        {activeTab === 'sending' && (<div className="flex space-x-4">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">Cancel</button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:bg-gray-400 cursor-pointer"
                                style={{
                                    backgroundColor: isSubmitting ? '#9CA3AF' : settings.themeColor
                                }}
                            >
                                {isSubmitting && <FiLoader className="animate-spin mr-2" />}
                                {isSubmitting ? 'Saving...' : (editCampaign ? 'Update Campaign' : 'Create Campaign')}
                            </button>
                        </div>)}
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Reusable Form Field Components ---
interface FormInputProps {
    label: string;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    required?: boolean;
    type?: string;
    placeholder?: string;
    min?: string;
    [key: string]: unknown;
}

interface FormSelectProps {
    label: string;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    required?: boolean;
    options: { value: string; label: string }[];
    [key: string]: unknown;
}

const FormInput = ({ label, name, register, required, type = "text", ...props }: FormInputProps) => (
    // ... (unchanged)
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            id={name}
            type={type}
            {...register(name, { required })}
            {...props}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>
);
const FormSelect = ({ label, name, register, required, options, ...props }: FormSelectProps) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            id={name}
            {...register(name, { required })}
            {...props}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {options.map((opt: { value: string, label: string }) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const ToggleButtonGroup = ({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (newValue: string[]) => void; }) => {
    const { settings } = useTheme();
    const handleSelect = (option: string) => {
        const newValue = value.includes(option) ? value.filter(item => item !== option) : [...value, option];
        onChange(newValue);
    };
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.length > 0 ? options.map(option => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${value.includes(option)
                            ? 'text-white'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                        style={{
                            backgroundColor: value.includes(option) ? settings.themeColor : 'white',
                            borderColor: value.includes(option) ? settings.themeColor : undefined
                        }}
                    >
                        {option}
                    </button>
                )) : <p className="text-sm text-gray-500">No options available.</p>}
            </div>
        </div>
    );
};