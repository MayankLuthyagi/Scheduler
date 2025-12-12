export interface Attachment {
    filename: string;
    content: string; // base64 encoded content
    contentType: string;
    note: string;
}

export interface Broadcast {
    broadcastId: string;
    broadcastName: string;
    emailSubject: string;
    emailBody: string;
    commaId: string[]; // Array of selected email addresses
    sendDate: Date;
    dailySendLimitPerSender: number;
    sendMethod: 'one-on-one' | 'cc' | 'bcc';
    toEmail: string;
    replyToEmail: string;
    sheetId: string;
    attachments: Attachment[]; // Store attachments directly in MongoDB
    randomSend: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BroadcastFormData {
    broadcastName: string;
    emailSubject: string;
    emailBody: string;
    commaId: string[];
    sendDate: Date;
    dailySendLimitPerSender: number;
    sendMethod: 'one-on-one' | 'cc' | 'bcc';
    toEmail: string;
    replyToEmail: string;
    sheetId: string;
    attachment?: File | null;
    attachmentNote?: string;
    randomSend: boolean;
}