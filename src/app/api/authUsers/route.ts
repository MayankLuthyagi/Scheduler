import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function OPTIONS() {
    return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const users = await db.collection('AuthUsers').find({}).toArray();

        const response = NextResponse.json({ success: true, users });
        return addCorsHeaders(response);
    } catch (error) {
        console.error('Error fetching users:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}



export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name } = body;

        if (!email || !name) {
            return NextResponse.json(
                { success: false, error: 'Email and name are required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();

        // Check if user already exists
        const existingUser = await db.collection('AuthUsers').findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        const newUser = {
            email,
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('AuthUsers').insertOne(newUser);

        const response = NextResponse.json({
            success: true,
            user: { ...newUser, _id: result.insertedId }
        });
        return addCorsHeaders(response);
    } catch (error) {
        console.error('Error creating user:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to create user' },
            { status: 500 }
        );
        return addCorsHeaders(response);
    }
}

