import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const emails = await db.collection('AuthEmails').find({}).toArray();

        return NextResponse.json({ success: true, emails });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch emails' },
            { status: 500 }
        );
    }
}



export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, main, app_password } = body;

        if (!email || !name || !main || !app_password) {
            return NextResponse.json(
                { success: false, error: 'Email, name, main, and app_password are required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Check if user already exists
        const existingUser = await db.collection('AuthEmails').findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Email already exists' },
                { status: 400 }
            );
        }

        const newEmail = {
            name,
            main,
            email,
            app_password,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('AuthEmails').insertOne(newEmail);

        return NextResponse.json({
            success: true,
            email: { ...newEmail, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Error creating authorized email:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create authorized email' },
            { status: 500 }
        );
    }
}

