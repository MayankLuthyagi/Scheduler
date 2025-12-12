import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const broadcastData: Record<string, unknown> = {
            broadcastId: uuidv4(),
            broadcastName: formData.get('broadcastName') as string,
            emailSubject: formData.get('emailSubject') as string,
            emailBody: formData.get('emailBody') as string,
            commaId: JSON.parse(formData.get('commaId') as string || '[]'),
            // sendDate is expected to be an ISO string (date + time)
            sendDate: formData.get('sendDate') ? new Date(formData.get('sendDate') as string) : null,
            dailySendLimitPerSender: parseInt(formData.get('dailySendLimitPerSender') as string || '10', 10),
            toEmail: formData.get('toEmail') as string || '',
            replyToEmail: formData.get('replyToEmail') as string || '',
            sendMethod: formData.get('sendMethod') as string,
            sheetId: formData.get('sheetId') as string || '',
            randomSend: formData.get('randomSend') === 'true',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const attachment = formData.get('attachment') as File | null;
        if (attachment && attachment.size > 0) {
            // Allow larger attachment for broadcasts (10MB)
            const maxSize = 10 * 1024 * 1024; // 10 MB
            if (attachment.size > maxSize) {
                return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
            }

            const buffer = Buffer.from(await attachment.arrayBuffer());
            const base64Content = buffer.toString('base64');

            broadcastData.attachments = [{
                filename: attachment.name,
                content: base64Content,
                contentType: attachment.type,
                note: formData.get('attachmentNote') as string || ''
            }];
        } else {
            broadcastData.attachments = [];
        }

        const { db } = await connectToDatabase();
        await db.collection('Broadcasts').insertOne(broadcastData);

        return NextResponse.json({ success: true, broadcastId: broadcastData.broadcastId, message: 'Broadcast created successfully' });
    } catch (error) {
        console.error('Error creating broadcast:', error);
        return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { db } = await connectToDatabase();
        const url = new URL(request.url!);
        const search = url.searchParams.get('search') || '';

        if (search) {
            const broadcasts = await db.collection('Broadcasts').find({ broadcastName: { $regex: search, $options: 'i' } }).toArray();
            return NextResponse.json(broadcasts);
        }

        const broadcasts = await db.collection('Broadcasts').find({}).toArray();
        return NextResponse.json(broadcasts);
    } catch (error) {
        console.error('Error fetching broadcasts:', error);
        return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
    }
}
