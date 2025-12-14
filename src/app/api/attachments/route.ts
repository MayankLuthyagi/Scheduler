import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const attachmentsCollection = db.collection('attachments');

        const attachments = await attachmentsCollection.find({}).sort({ createdAt: -1 }).toArray();

        return NextResponse.json({
            success: true,
            attachments: attachments.map(a => ({
                attachmentId: a._id.toString(),
                name: a.name,
                filename: a.filename,
                contentType: a.contentType,
                size: a.size,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt
            }))
        });
    } catch (error) {
        console.error('Error fetching attachments:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch attachments' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const file = formData.get('file') as File;

        if (!name || !file) {
            return NextResponse.json({ success: false, error: 'Name and file are required' }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const content = buffer.toString('base64');

        const { db } = await connectToDatabase();
        const attachmentsCollection = db.collection('attachments');

        const newAttachment = {
            name,
            filename: file.name,
            content,
            contentType: file.type,
            size: file.size,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await attachmentsCollection.insertOne(newAttachment);

        return NextResponse.json({
            success: true,
            attachment: {
                attachmentId: result.insertedId.toString(),
                name: newAttachment.name,
                filename: newAttachment.filename,
                contentType: newAttachment.contentType,
                size: newAttachment.size,
                createdAt: newAttachment.createdAt,
                updatedAt: newAttachment.updatedAt
            }
        });
    } catch (error) {
        console.error('Error creating attachment:', error);
        return NextResponse.json({ success: false, error: 'Failed to create attachment' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const attachmentId = searchParams.get('attachmentId');

        if (!attachmentId) {
            return NextResponse.json({ success: false, error: 'Attachment ID is required' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const attachmentsCollection = db.collection('attachments');

        const result = await attachmentsCollection.deleteOne({ _id: new ObjectId(attachmentId) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'Attachment not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete attachment' }, { status: 500 });
    }
}
