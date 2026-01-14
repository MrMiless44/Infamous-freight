# Avatar System - Complete Implementation Guide

**Version**: 2.2.0  
**Date**: January 14, 2026  
**Status**: 100% Complete

---

## 📋 Overview

The Avatar System provides:

- ✅ **4 Featured System Avatars** (shipped defaults) displayed to all users
- ✅ **User Avatar Uploads** (6 MB limit, PNG/JPEG/WebP)
- ✅ **Avatar Selection & Persistence** (JSON-based store)
- ✅ **React Component** (AvatarSelector) for easy integration
- ✅ **Full API Endpoints** with JWT authentication and rate limiting

---

## 🗂️ Project Structure

```
web/
├── public/avatars/main/
│   ├── manifest.json              # System avatars manifest
│   ├── main-01.png                # (to be uploaded)
│   ├── main-02.png
│   ├── main-03.png
│   └── main-04.png
└── components/
    └── AvatarSelector.tsx          # React component for UI

api/
├── src/avatars/
│   ├── store.js                   # Persistent JSON storage
│   └── routes.js                  # All avatar endpoints
└── public/uploads/avatars/        # User upload destination
```

---

## 🚀 Quick Start

### 1. Add the 4 System Avatar Images

**Location**: `web/public/avatars/main/`

**Method**: Upload via VS Code Explorer

1. Right-click `web/public/avatars/main/` → Upload Files
2. Name them exactly: `main-01.png`, `main-02.png`, `main-03.png`, `main-04.png`

Or via terminal:

```bash
cp your-image-1.png web/public/avatars/main/main-01.png
cp your-image-2.png web/public/avatars/main/main-02.png
cp your-image-3.png web/public/avatars/main/main-03.png
cp your-image-4.png web/public/avatars/main/main-04.png
```

The manifest at `web/public/avatars/main/manifest.json` already maps these files.

---

### 2. Integrate AvatarSelector Component into Your Page

**Example** (`web/pages/profile.tsx` or similar):

```tsx
"use client";

import { AvatarSelector } from "../components/AvatarSelector";
import { useAuth } from "../hooks/useAuth"; // Your auth hook

export default function ProfilePage() {
  const { token } = useAuth();

  return (
    <div>
      <h1>My Profile</h1>
      <AvatarSelector
        token={token}
        showUpload={true}
        onSelectionChange={(selection) => {
          console.log("Avatar selected:", selection);
          // Optionally sync to your user profile DB
        }}
      />
    </div>
  );
}
```

---

## 📡 API Endpoints

All endpoints are at `POST /api/avatars/*` and require proper authentication.

### Get System Avatars

**Endpoint**: `GET /api/avatars/system`  
**Auth**: No  
**Rate Limit**: 100/15min

```bash
curl http://localhost:3001/api/avatars/system
```

**Response**:

```json
{
  "success": true,
  "data": {
    "featured": [
      {
        "id": "main-01",
        "name": "Infinity Operator",
        "imageUrl": "/avatars/main/main-01.png",
        "type": "system"
      }
      // ... (3 more)
    ]
  }
}
```

---

### List User Avatars

**Endpoint**: `GET /api/avatars/user`  
**Auth**: Required (Bearer token)  
**Rate Limit**: 100/15min

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/avatars/user
```

**Response**:

```json
{
  "success": true,
  "data": {
    "avatars": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "ownerUserId": "user-123",
        "name": "My Custom Avatar",
        "imageUrl": "/uploads/avatars/abc123def456.png",
        "createdAt": "2026-01-14T10:00:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### Upload User Avatar

**Endpoint**: `POST /api/avatars/user/upload`  
**Auth**: Required (Bearer token)  
**Rate Limit**: 100/15min  
**Content-Type**: `multipart/form-data`

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.png" \
  -F "name=My Custom Avatar" \
  http://localhost:3001/api/avatars/user/upload
```

**Parameters**:

- `avatar` (file, required): PNG/JPEG/WebP, max 6 MB
- `name` (string, required): Display name (1-100 chars)

**Response**:

```json
{
  "success": true,
  "data": {
    "avatar": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ownerUserId": "user-123",
      "name": "My Custom Avatar",
      "imageUrl": "/uploads/avatars/abc123def456.png",
      "createdAt": "2026-01-14T10:00:00Z"
    },
    "message": "Avatar uploaded successfully"
  }
}
```

---

### Delete User Avatar

**Endpoint**: `DELETE /api/avatars/user/:avatarId`  
**Auth**: Required (Bearer token)  
**Rate Limit**: 100/15min

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/avatars/user/550e8400-e29b-41d4-a716-446655440000
```

**Response**:

```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

---

### Get Avatar Selection

**Endpoint**: `GET /api/avatars/selection`  
**Auth**: Required (Bearer token)  
**Rate Limit**: 100/15min

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/avatars/selection
```

**Response**:

```json
{
  "success": true,
  "data": {
    "selection": {
      "type": "system",
      "id": "main-01"
    }
  }
}
```

---

### Set Avatar Selection

**Endpoint**: `POST /api/avatars/selection`  
**Auth**: Required (Bearer token)  
**Rate Limit**: 100/15min

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"system","id":"main-02"}' \
  http://localhost:3001/api/avatars/selection
```

**Request Body**:

```json
{
  "type": "system" | "user",
  "id": "main-02" | "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "selection": {
      "type": "system",
      "id": "main-02"
    },
    "message": "Avatar selection updated"
  }
}
```

---

## 📦 Storage Details

### System Avatars

- **Location**: `web/public/avatars/main/manifest.json`
- **Format**: JSON with featured avatars metadata
- **Scope**: Read-only, global for all users
- **Updates**: Manual (edit manifest.json + add images)

### User Avatars

- **Database**: `api/data/avatars.json` (persistent JSON store)
- **Structure**:
  ```json
  {
    "avatars": [
      {
        "id": "uuid",
        "ownerUserId": "user-id",
        "name": "Avatar Name",
        "imageUrl": "/uploads/avatars/filename.png",
        "createdAt": "2026-01-14T10:00:00Z"
      }
    ],
    "selections": {
      "user-id": { "type": "system", "id": "main-01" }
    }
  }
  ```

### Upload Storage

- **Location**: `api/public/uploads/avatars/`
- **Naming**: Random hex + file extension (e.g., `abc123def456.png`)
- **Cleanup**: Manual (delete files from this folder as needed)

---

## 🔐 Security & Validation

### Rate Limiting

- All endpoints: **100 requests / 15 minutes** (per user or IP)
- Multer file size: **6 MB maximum**

### Validation

- **File types**: PNG, JPEG, WebP only
- **Name length**: 1-100 characters
- **User ownership**: Avatars can only be deleted by owner
- **Auth**: JWT Bearer token required for user operations

### Error Handling

- Invalid file type → 400 Bad Request
- File too large → 413 Payload Too Large
- Unauthorized user → 401 Unauthorized
- Not found → 404 Not Found

---

## 🛠️ Development

### Start the System

```bash
# From root
pnpm install

# Build shared package
pnpm --filter @infamous-freight/shared build

# Start API (watch mode)
pnpm api:dev

# Start Web (watch mode)
pnpm web:dev
```

### Test Avatar Routes

```bash
# Fetch system avatars (no auth)
curl http://localhost:3001/api/avatars/system

# Get user avatars (with token)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/avatars/user

# Upload (with token)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@test.png" \
  -F "name=Test Avatar" \
  http://localhost:3001/api/avatars/user/upload
```

---

## 📝 Component Props

**AvatarSelector.tsx**:

```tsx
interface AvatarSelectorProps {
  token?: string; // JWT token for authenticated operations
  onSelectionChange?: (selection: AvatarSelection) => void; // Callback when user selects
  showUpload?: boolean; // Show upload button (default: true)
}
```

---

## 🚀 Deploy Instructions

### Docker

```bash
# Avatars are built into the images
docker-compose up -d
```

### Vercel (Web)

- Next.js automatically serves `/public/avatars/main/` as static files
- No special configuration needed

### API (Standalone)

- Ensure `api/public/uploads/avatars/` is writable
- Set `API_PORT` env var if needed (default: 4000)
- Store persists to `api/data/avatars.json`

---

## 🔄 Workflow Example

1. **User visits profile page**
   - `AvatarSelector` fetches system avatars (no auth needed)
   - Shows 4 featured avatars

2. **User logs in**
   - Component uses JWT token from auth context
   - Fetches their personal avatars + current selection
   - Shows upload button

3. **User uploads custom avatar**
   - File sent to `POST /api/avatars/user/upload`
   - Stored in `api/public/uploads/avatars/`
   - Metadata saved to `api/data/avatars.json`
   - Component refreshes and displays new avatar

4. **User selects avatar**
   - `POST /api/avatars/selection` saves choice
   - Persisted to store
   - Component highlights selected avatar

---

## 📞 Troubleshooting

| Issue                 | Solution                                                      |
| --------------------- | ------------------------------------------------------------- |
| Images not showing    | Ensure `main-01.png` etc. exist in `web/public/avatars/main/` |
| Upload fails          | Check file size (< 6 MB) and type (PNG/JPEG/WebP)             |
| 401 Unauthorized      | Verify Bearer token is valid and not expired                  |
| Upload folder missing | API creates `api/public/uploads/avatars/` on first request    |
| Store not persisting  | Check permissions on `api/data/` directory                    |

---

## ✅ Checklist

- [x] System avatars manifest created
- [x] API store (JSON-based) implemented
- [x] All API endpoints built + documented
- [x] React component integrated
- [x] Rate limiting & validation applied
- [x] Error handling complete
- [x] Ready for production

---

**Implementation Complete**: January 14, 2026  
**Maintainer**: Infæmous Freight Development Team
