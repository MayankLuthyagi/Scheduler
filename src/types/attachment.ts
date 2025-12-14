export interface Attachment {
    attachmentId: string;
    name: string;
    filename: string;
    content: string; // base64 encoded content
    contentType: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AttachmentFormData {
    name: string;
    file: File | null;
}
