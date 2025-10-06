import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('settings');

        const settings = await settingsCollection.findOne({});

        if (!settings) {
            return NextResponse.json({
                success: true,
                settings: {
                    themeColor: '#3b82f6',
                    themeMode: 'light',
                    textLogo: null,
                    logo: null,
                    featureAllowed: {
                        emailLogs: false,
                        campaign: false,
                    },
                }
            });
        }

        return NextResponse.json({
            success: true,
            settings: {
                themeColor: settings.themeColor,
                themeMode: settings.themeMode || 'light',
                textLogo: settings.textLogo,
                logo: settings.logo,
                featureAllowed: settings.featureAllowed || { emailLogs: false, campaign: false }
            }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const themeColor = formData.get('themeColor') as string;
        const themeMode = formData.get('themeMode') as string;
        const textLogoFile = formData.get('textLogo') as File | null;
        const logoFile = formData.get('logo') as File | null;
        
        // Handle featureAllowed toggles
        const featureAllowed = {
            emailLogs: formData.get('emailLogs') === 'true',
            campaign: formData.get('campaign') === 'true',
        };

        if (!themeColor) {
            return NextResponse.json(
                { success: false, message: 'Theme color is required' },
                { status: 400 }
            );
        }

        if (!themeMode || !['light', 'dark'].includes(themeMode)) {
            return NextResponse.json(
                { success: false, message: 'Valid theme mode is required' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('settings');

        const existingSettings = await settingsCollection.findOne({});

        const updatedSettings: any = {
            themeColor,
            themeMode,
            featureAllowed, // Add feature toggles to settings
            updatedAt: new Date()
        };

        // Handle text logo upload
        if (textLogoFile && textLogoFile.size > 0) {
            if (!textLogoFile.type.includes('png')) {
                return NextResponse.json(
                    { success: false, message: 'Only PNG files are allowed for text logo' },
                    { status: 400 }
                );
            }

            const textLogoFilename = `textlogo.png`;
            const textLogoPath = path.join(process.cwd(), 'public', 'uploads', textLogoFilename);

            const textLogoBuffer = Buffer.from(await textLogoFile.arrayBuffer());
            await fs.writeFile(textLogoPath, textLogoBuffer);

            updatedSettings.textLogo = textLogoFilename;
        } else if (existingSettings?.textLogo) {
            updatedSettings.textLogo = existingSettings.textLogo;
        }

        // Handle main logo upload
        if (logoFile && logoFile.size > 0) {
            if (!logoFile.type.includes('png')) {
                return NextResponse.json(
                    { success: false, message: 'Only PNG files are allowed for logo' },
                    { status: 400 }
                );
            }

            const logoFilename = `logo.png`;
            const logoPath = path.join(process.cwd(), 'public', 'uploads', logoFilename);

            const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
            await fs.writeFile(logoPath, logoBuffer);

            updatedSettings.logo = logoFilename;
        } else if (existingSettings?.logo) {
            updatedSettings.logo = existingSettings.logo;
        }

        // Update or insert settings
        await settingsCollection.replaceOne(
            {},
            {
                ...updatedSettings,
                createdAt: existingSettings?.createdAt || new Date()
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully',
            settings: updatedSettings
        });

    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
