# Dynamic Theme & Settings System

This application includes a comprehensive dynamic theme and settings management system that allows administrators to customize the appearance of the application through a web interface.

## Features

### 🎨 Dynamic Theme Color
- **Color Picker Interface**: Easy-to-use color picker in admin settings
- **Real-time Preview**: See color changes immediately while selecting
- **CSS Variable Integration**: Theme color is applied globally via CSS custom properties
- **Automatic Variants**: System automatically generates light and dark variants of the selected color

### 🖼️ Logo Management
- **Dual Logo Support**: 
  - Main Logo (`logo.png`)
  - Text Logo (`textlogo.png`)
- **File Validation**: Only PNG files accepted (max 5MB)
- **Automatic Replacement**: New uploads replace existing files with same names
- **Real-time Display**: Updated logos appear immediately across the application

### 💾 Database Storage
- **Single Settings Document**: Only one settings record exists in the `settings` collection
- **Upsert Operations**: Settings are updated or created as needed
- **Atomic Updates**: All settings changes are processed atomically

## File Structure

```
src/
├── types/
│   └── settings.ts                 # TypeScript types for settings
├── lib/
│   └── theme.ts                   # Theme utility functions
├── contexts/
│   └── ThemeContext.tsx           # React context for theme management
├── app/
│   ├── api/
│   │   └── settings/
│   │       └── route.ts           # API endpoints for settings CRUD
│   └── admin/
│       └── settings/
│           └── page.tsx           # Admin settings page
public/
└── uploads/
    ├── logo.png                   # Main logo file
    └── textlogo.png              # Text logo file
```

## API Endpoints

### GET `/api/settings`
Retrieves current site settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "themeColor": "#3b82f6",
    "textLogo": "textlogo.png",
    "logo": "logo.png"
  }
}
```

### POST `/api/settings`
Updates site settings with new values.

**Request:** `FormData`
- `themeColor` (string): Hex color code
- `textLogo` (File, optional): PNG file for text logo
- `logo` (File, optional): PNG file for main logo

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": { ... }
}
```

## Database Schema

### Settings Collection
```typescript
interface SiteSettings {
  _id?: string;
  textLogo?: string;     // filename: "textlogo.png"
  logo?: string;         // filename: "logo.png"
  themeColor: string;    // hex color: "#3b82f6"
  updatedAt?: Date;
  createdAt?: Date;
}
```

## Usage

### Accessing Current Settings
```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { settings, isLoading, refreshSettings } = useTheme();
  
  return (
    <div style={{ backgroundColor: settings.themeColor }}>
      {settings.logo && (
        <img src={`/uploads/${settings.logo}`} alt="Logo" />
      )}
    </div>
  );
}
```

### Applying Theme Colors
```css
/* Using CSS variables */
.my-element {
  background-color: var(--theme-color);
  border-color: var(--theme-color-light);
  color: var(--theme-color-dark);
}
```

```typescript
// Using inline styles
<button style={{ backgroundColor: settings.themeColor }}>
  Click me
</button>
```

### Theme Utility Functions
```typescript
import { 
  generateColorVariants, 
  getContrastColor, 
  isValidHexColor 
} from '@/lib/theme';

// Generate color variants
const variants = generateColorVariants('#3b82f6');
// Returns: { light: "#6ba6f8", dark: "#1052d4" }

// Get contrasting text color
const textColor = getContrastColor('#3b82f6');
// Returns: "#ffffff" for dark backgrounds, "#000000" for light

// Validate hex color
const isValid = isValidHexColor('#3b82f6'); // true
```

## Admin Interface

### Navigation
Access the settings through the admin dashboard:
1. Login to admin panel (`/admin/login`)
2. Navigate to **Settings** in the sidebar
3. Or click the **Settings** card on the dashboard

### Settings Form
- **Theme Color**: Use color picker or input hex code directly
- **Main Logo**: Upload PNG file (replaces `logo.png`)
- **Text Logo**: Upload PNG file (replaces `textlogo.png`)
- **Preview**: Real-time preview of selected colors
- **Current Assets**: Display of currently uploaded logos

### Validation
- Only PNG files accepted for logos
- Maximum file size: 5MB
- Theme color must be valid hex format
- All changes are validated before saving

## Technical Implementation

### File Upload Handling
- Files are saved to `public/uploads/` with fixed names
- Existing files are overwritten
- File type validation ensures only PNG files
- Size validation prevents oversized uploads

### CSS Variable System
- Theme color is applied to CSS custom properties
- Automatic generation of color variants
- Global application across all components
- Real-time updates without page refresh

### Context Management
- React Context provides global access to settings
- Automatic fetching on app initialization
- Manual refresh capability for admin updates
- Loading states for better UX

### Database Operations
- Upsert pattern ensures single settings document
- Atomic updates prevent data inconsistency
- Timestamps track creation and modification
- Error handling for database failures

## Browser Support

- Modern browsers with CSS custom property support
- ES6+ JavaScript features
- File API for upload handling
- FormData for multipart uploads

## Security Considerations

- Admin authentication required for settings access
- File type validation prevents malicious uploads
- File size limits prevent storage abuse
- Input sanitization for color values
- CSRF protection via Next.js built-ins