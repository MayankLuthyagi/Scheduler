export interface SiteSettings {
    _id?: string;
    textLogo?: string; // filename for text logo
    logo?: string; // filename for main logo
    themeColor: string; // hex color code
    themeMode: 'light' | 'dark'; // theme mode
    featureAllowed: {
        [key: string]: boolean;
    };
    updatedAt?: Date;
    createdAt?: Date;
}

export interface SettingsFormData {
    textLogo?: File;
    logo?: File;
    themeColor: string;
    themeMode: 'light' | 'dark';
    featureAllowed: {
        [key: string]: boolean;
    };
}
