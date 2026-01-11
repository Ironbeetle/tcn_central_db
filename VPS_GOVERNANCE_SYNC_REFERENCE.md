# VPS Governance Sync Reference

This document describes the Governance/Council sync API that the VPS must implement to receive council data from the TCN Central Database.

---

## Overview

The Council Profile Editor in the Central DB has a "Sync to VPS" button that pushes the current council term and all council members to the VPS.

**This is separate from the fnmember sync** - different endpoint, different schema, different data.

---

## Endpoint Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/governance/sync` | POST | Receive council term and council members |

---

## Authentication

All requests include these headers:

```
x-api-key: <API_KEY>
Content-Type: application/json
```

The VPS should validate the `x-api-key` header matches the configured API key.

---

## Request Body Structure

```json
{
  "council": {
    "source_id": "cuid-from-central-db",
    "council_start": "2024-01-15T00:00:00.000Z",
    "council_end": "2028-01-15T00:00:00.000Z"
  },
  "members": [
    {
      "source_id": "member-cuid-from-central-db",
      "position": "CHIEF",
      "first_name": "Doreen",
      "last_name": "Spence",
      "portfolios": ["TREATY", "ECONOMIC_DEVELOPMENT", "LEADERSHIP"],
      "email": "dspence@tataskweyak.com",
      "phone": "12045551234",
      "bio": "Biography text or null",
      "image_url": "https://example.com/photo.jpg or null"
    },
    {
      "source_id": "member2-cuid",
      "position": "COUNCILLOR",
      "first_name": "Abby",
      "last_name": "Garson-Wavey",
      "portfolios": ["TREATY", "HEALTH", "EDUCATION"],
      "email": "abbyg@tataskweyak.com",
      "phone": "12045551235",
      "bio": null,
      "image_url": null
    }
  ]
}
```

---

## Field Definitions

### council Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_id` | string | Yes | CUID from Central DB - use for upsert matching |
| `council_start` | ISO datetime | Yes | Term start date |
| `council_end` | ISO datetime | Yes | Term end date |

### members Array

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_id` | string | Yes | CUID from Central DB - use for upsert matching |
| `position` | enum | Yes | `"CHIEF"` or `"COUNCILLOR"` |
| `first_name` | string | Yes | First name |
| `last_name` | string | Yes | Last name |
| `portfolios` | string[] | Yes | Array of portfolio enums (0-4 items) |
| `email` | string | Yes | Email address |
| `phone` | string | Yes | Phone number |
| `bio` | string \| null | No | Biography text |
| `image_url` | string \| null | No | Profile photo URL |

### Position Enum Values

```
CHIEF
COUNCILLOR
```

### Portfolio Enum Values

```
TREATY
HEALTH
EDUCATION
HOUSING
ECONOMIC_DEVELOPMENT
ENVIRONMENT
PUBLIC_SAFETY
LEADERSHIP
```

---

## Expected Response

### Success Response

```json
{
  "success": true,
  "data": {
    "council": {
      "id": "vps-council-id",
      "action": "created"  // or "updated"
    },
    "members": {
      "created": 5,
      "updated": 2,
      "deleted": 0
    },
    "errors": []
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

---

## Prisma Schema Required

The VPS must have these models in the `governance` schema:

```prisma
model Current_Council {
  id            String           @id @default(cuid())
  created       DateTime         @default(now())
  updated       DateTime         @default(now()) @updatedAt
  council_start DateTime  
  council_end   DateTime
  sourceId      String?          @unique  // ⚠️ REQUIRED for sync
  members       Council_Member[]
  @@schema("governance")
}

model Council_Member {
  id              String           @id @default(cuid())
  created         DateTime         @default(now())
  updated         DateTime         @default(now()) @updatedAt
  position        Positions        @default(CHIEF)
  first_name      String
  last_name       String
  portfolios      Portfolios[]     // Array field
  email           String
  phone           String
  bio             String?
  image_url       String?
  councilId       String?
  sourceId        String?          @unique  // ⚠️ REQUIRED for sync
  Current_Council Current_Council? @relation(fields: [councilId], references: [id], onDelete: Cascade)
  @@schema("governance")
}

enum Positions {
  CHIEF
  COUNCILLOR
  @@schema("governance")
}

enum Portfolios {
  TREATY
  HEALTH
  EDUCATION
  HOUSING
  ECONOMIC_DEVELOPMENT
  ENVIRONMENT
  PUBLIC_SAFETY
  LEADERSHIP              // ⚠️ Make sure this exists
  @@schema("governance")
}
```

**Critical Fields:**
- `sourceId` on `Current_Council` - Must be unique, used to match/update councils
- `sourceId` on `Council_Member` - Must be unique, used to match/update members
- `LEADERSHIP` in `Portfolios` enum - Recently added

---

## Handler Implementation

Here's a complete implementation for the VPS endpoint:

```typescript
// /api/v1/governance/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // 1. Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { council, members } = await req.json();

    if (!council || !members) {
      return NextResponse.json(
        { success: false, error: 'Missing council or members data' },
        { status: 400 }
      );
    }

    const result = {
      council: { id: '', action: '' as 'created' | 'updated' },
      members: { created: 0, updated: 0, deleted: 0 },
      errors: [] as string[],
    };

    // 3. Upsert Council by sourceId
    const existingCouncil = await prisma.current_Council.findUnique({
      where: { sourceId: council.source_id },
    });

    let councilRecord;
    if (existingCouncil) {
      councilRecord = await prisma.current_Council.update({
        where: { id: existingCouncil.id },
        data: {
          council_start: new Date(council.council_start),
          council_end: new Date(council.council_end),
        },
      });
      result.council = { id: councilRecord.id, action: 'updated' };
    } else {
      councilRecord = await prisma.current_Council.create({
        data: {
          sourceId: council.source_id,
          council_start: new Date(council.council_start),
          council_end: new Date(council.council_end),
        },
      });
      result.council = { id: councilRecord.id, action: 'created' };
    }

    // 4. Upsert each Council Member by sourceId
    for (const member of members) {
      try {
        const existingMember = await prisma.council_Member.findUnique({
          where: { sourceId: member.source_id },
        });

        if (existingMember) {
          await prisma.council_Member.update({
            where: { id: existingMember.id },
            data: {
              position: member.position,
              first_name: member.first_name,
              last_name: member.last_name,
              portfolios: member.portfolios,
              email: member.email.toLowerCase(),
              phone: member.phone,
              bio: member.bio || null,
              image_url: member.image_url || null,
              councilId: councilRecord.id,
            },
          });
          result.members.updated++;
        } else {
          await prisma.council_Member.create({
            data: {
              sourceId: member.source_id,
              position: member.position,
              first_name: member.first_name,
              last_name: member.last_name,
              portfolios: member.portfolios,
              email: member.email.toLowerCase(),
              phone: member.phone,
              bio: member.bio || null,
              image_url: member.image_url || null,
              councilId: councilRecord.id,
            },
          });
          result.members.created++;
        }
      } catch (memberError) {
        result.errors.push(
          `Failed to sync ${member.first_name} ${member.last_name}: ${memberError}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Governance sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Configuration Checklist

- [ ] **Schema**: `Current_Council` model exists with `sourceId` field (unique)
- [ ] **Schema**: `Council_Member` model exists with `sourceId` field (unique)
- [ ] **Schema**: `Portfolios` enum includes `LEADERSHIP`
- [ ] **Schema**: Run `npx prisma generate` after changes
- [ ] **Schema**: Run `npx prisma db push` to apply changes
- [ ] **Endpoint**: `/api/v1/governance/sync` POST handler created
- [ ] **Auth**: API key validation implemented
- [ ] **Logic**: Upsert council by `sourceId`
- [ ] **Logic**: Upsert members by `sourceId`
- [ ] **Logic**: Link members to council via `councilId`

---

## Testing

### Test with curl

```bash
curl -X POST https://tcnaux.ca/api/v1/governance/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "council": {
      "source_id": "test-council-001",
      "council_start": "2024-01-15T00:00:00.000Z",
      "council_end": "2028-01-15T00:00:00.000Z"
    },
    "members": [
      {
        "source_id": "test-chief-001",
        "position": "CHIEF",
        "first_name": "Test",
        "last_name": "Chief",
        "portfolios": ["LEADERSHIP", "TREATY"],
        "email": "testchief@example.com",
        "phone": "1234567890",
        "bio": "Test biography",
        "image_url": null
      },
      {
        "source_id": "test-councillor-001",
        "position": "COUNCILLOR",
        "first_name": "Test",
        "last_name": "Councillor",
        "portfolios": ["HEALTH", "EDUCATION"],
        "email": "testcouncillor@example.com",
        "phone": "0987654321",
        "bio": null,
        "image_url": null
      }
    ]
  }'
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "council": {
      "id": "generated-id",
      "action": "created"
    },
    "members": {
      "created": 2,
      "updated": 0,
      "deleted": 0
    },
    "errors": []
  }
}
```

### Verify in Database

```sql
-- Check council was created
SELECT * FROM governance."Current_Council" WHERE "sourceId" = 'test-council-001';

-- Check members were created
SELECT * FROM governance."Council_Member" WHERE "sourceId" LIKE 'test-%';
```

---

## Troubleshooting

### "Invalid enum value" error
- Make sure `LEADERSHIP` is in the `Portfolios` enum
- Run `npx prisma generate` and `npx prisma db push`

### "Unique constraint failed on sourceId"
- The `sourceId` must be unique - this is expected behavior
- Check if you're trying to create a duplicate

### Members not linked to council
- Ensure `councilId` is set when creating/updating members
- Check the council was created first before members

### 401 Unauthorized
- Verify the `x-api-key` header matches `process.env.API_KEY`
- Check the API key is correctly configured in `.env`
