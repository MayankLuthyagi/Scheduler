import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SiteSettings } from '@/types/settings';
import path from 'path';
import fs from 'fs/promises';
import { convertBufferToWebp } from '@/lib/optimiser';
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const settingsCollection = db.collection('Settings');

        const settings = await settingsCollection.findOne({});

        if (!settings) {
            return NextResponse.json({
                success: true,
                settings: {
                    themeColor: '#000000',
                    themeMode: 'light',
                    textLogo: null,
                    logo: null,
                    featureAllowed: {
                        emailTemplate: false,
                        emailLogs: false,
                        campaign: false,
                        oneTimeBroadcast: false,
                        dateBasedAutomation: false,
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
                featureAllowed: settings.featureAllowed || {
                    emailTemplate: false,
                    emailLogs: false,
                    campaign: false,
                    oneTimeBroadcast: false,
                    dateBasedAutomation: false,
                }
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
            emailTemplate: formData.get('emailTemplate') === 'true',
            emailLogs: formData.get('emailLogs') === 'true',
            campaign: formData.get('campaign') === 'true',
            oneTimeBroadcast: formData.get('oneTimeBroadcast') === 'true',
            dateBasedAutomation: formData.get('dateBasedAutomation') === 'true',
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
        const settingsCollection = db.collection('Settings');

        const existingSettings = await settingsCollection.findOne({});

        const updatedSettings: Partial<SiteSettings> = {
            themeColor,
            themeMode: themeMode as 'light' | 'dark',
            featureAllowed, // Add feature toggles to settings
            updatedAt: new Date()
        };

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true }).catch(() => { });

        // Handle text logo upload
        if (textLogoFile && textLogoFile.size > 0) {
            const textLogoFilename = `textlogo.webp`;
            const textLogoPath = path.join(uploadsDir, textLogoFilename);

            const buffer = Buffer.from(await textLogoFile.arrayBuffer());
            // Use shared optimiser helper to convert buffer to webp
            await convertBufferToWebp(buffer, textLogoPath, 80);

            updatedSettings.textLogo = textLogoFilename;
        } else if (existingSettings?.textLogo) {
            updatedSettings.textLogo = existingSettings.textLogo;
        }

        // Handle main logo upload
        if (logoFile && logoFile.size > 0) {
            const logoFilename = `logo.webp`;
            const logoPath = path.join(uploadsDir, logoFilename);

            const buffer = Buffer.from(await logoFile.arrayBuffer());
            // Use shared optimiser helper to convert buffer to webp
            await convertBufferToWebp(buffer, logoPath, 80);

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
