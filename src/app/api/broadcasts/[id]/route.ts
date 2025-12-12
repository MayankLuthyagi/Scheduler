import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { db } = await connectToDatabase();
        const url = new URL(request.url!);
        // id is included in the path, extract from url pathname
        const parts = url.pathname.split('/');
        const id = parts[parts.length - 1];

        if (!id) return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });

        const broadcast = await db.collection('Broadcasts').findOne({ broadcastId: id });
        if (!broadcast) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });

        return NextResponse.json(broadcast);
    } catch (error) {
        console.error('Error fetching broadcast:', error);
        return NextResponse.json({ error: 'Failed to fetch broadcast' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Support both JSON PUT and formData PUT (for file attachments)
        let updateData: Record<string, any> = { updatedAt: new Date() };

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            // extract id from formData or path
            const url = new URL(request.url!);
            const parts = url.pathname.split('/');
            const pathId = parts[parts.length - 1];
            const broadcastId = (formData.get('broadcastId') as string) || pathId;
            if (!broadcastId) return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });

            updateData.broadcastName = formData.get('broadcastName') as string;
            updateData.emailSubject = formData.get('emailSubject') as string;
            updateData.emailBody = formData.get('emailBody') as string;
            updateData.commaId = JSON.parse(formData.get('commaId') as string || '[]');
            updateData.sendDate = formData.get('sendDate') ? new Date(formData.get('sendDate') as string) : null;
            updateData.dailySendLimitPerSender = parseInt(formData.get('dailySendLimitPerSender') as string || '10', 10);
            updateData.toEmail = formData.get('toEmail') as string || '';
            updateData.replyToEmail = formData.get('replyToEmail') as string || '';
            updateData.sendMethod = formData.get('sendMethod') as string;
            updateData.sheetId = formData.get('sheetId') as string || '';
            updateData.randomSend = formData.get('randomSend') === 'true';

            const attachment = formData.get('attachment') as File | null;
            if (attachment && attachment.size > 0) {
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (attachment.size > maxSize) return NextResponse.json({ error: 'File too large' }, { status: 400 });
                const buffer = Buffer.from(await attachment.arrayBuffer());
                const base64Content = buffer.toString('base64');
                updateData.attachments = [{ filename: attachment.name, content: base64Content, contentType: attachment.type, note: formData.get('attachmentNote') as string || '' }];
            }

            const { db } = await connectToDatabase();
            const result = await db.collection('Broadcasts').updateOne({ broadcastId }, { $set: updateData });
            if (result.matchedCount === 0) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });

            return NextResponse.json({ success: true, message: 'Broadcast updated successfully' });
        } else {
            const body = await request.json().catch(() => null);
            if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

            const id = body.broadcastId || body.broadcast_id || null;
            if (!id) return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });

            // Map allowed fields
            const allowed = ['broadcastName', 'emailSubject', 'emailBody', 'commaId', 'sendDate', 'dailySendLimitPerSender', 'toEmail', 'replyToEmail', 'sendMethod', 'sheetId', 'randomSend'];
            allowed.forEach(k => {
                if (k in body) updateData[k] = body[k];
            });
            if (updateData.sendDate) updateData.sendDate = new Date(updateData.sendDate);

            const { db } = await connectToDatabase();
            const result = await db.collection('Broadcasts').updateOne({ broadcastId: id }, { $set: updateData });
            if (result.matchedCount === 0) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });

            return NextResponse.json({ success: true, message: 'Broadcast updated successfully' });
        }
    } catch (error) {
        console.error('Error updating broadcast:', error);
        return NextResponse.json({ error: 'Failed to update broadcast' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url!);
        const parts = url.pathname.split('/');
        const id = parts[parts.length - 1];
        if (!id) return NextResponse.json({ error: 'Broadcast ID is required' }, { status: 400 });

        const { db } = await connectToDatabase();
        const result = await db.collection('Broadcasts').deleteOne({ broadcastId: id });
        if (result.deletedCount === 0) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Broadcast deleted successfully' });
    } catch (error) {
        console.error('Error deleting broadcast:', error);
        return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 });
    }
}
