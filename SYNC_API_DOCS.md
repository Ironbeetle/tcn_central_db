# TCN Portal Sync API Documentation

## Overview

This API enables **bidirectional synchronization** between the **Master Database Manager** and the **TCN Member Portal**.

### Sync Directions

| Direction | Models | Source of Truth | Description |
|-----------|--------|-----------------|-------------|
| **Master → Portal** | `fnmember`, `Barcode` | Master DB | Push member data and barcodes to portal |
| **Portal → Master** | `Profile`, `Family` | Portal | Pull member-updated contact info to master |

The portal maintains its own authentication system (`fnauth` model) for portal-specific user accounts - this is never synced.

## Security

### Authentication

All API endpoints require an API key passed in the `x-api-key` header.

```bash
curl -H "x-api-key: YOUR_API_KEY" https://portal.tcn.ca/api/sync/status
```

### Rate Limiting

- Standard endpoints: 100 requests per minute per IP
- Batch endpoint: 10 requests per minute per IP

### Best Practices

1. Store API keys securely (environment variables, secrets manager)
2. Use HTTPS in production
3. Consider VPN tunnel for additional security layer
4. Rotate API keys periodically
5. Monitor API access logs

---

## Endpoints

### 1. Status Check

Check API health and get database statistics.

**GET** `/api/sync/status`

**Response:**
```json
{
  "success": true,
  "message": "Sync API is healthy",
  "data": {
    "healthy": true,
    "timestamp": "2025-11-30T12:00:00.000Z",
    "database": {
      "connected": true,
      "schema": "fnmemberlist"
    },
    "stats": {
      "members": {
        "total": 4700,
        "activated": 500,
        "pending": 50,
        "notActivated": 4150,
        "deceased": 100
      },
      "profiles": 4700,
      "barcodes": 4700,
      "families": 3000
    },
    "lastUpdated": {
      "member": "2025-11-30T11:55:00.000Z",
      "profile": "2025-11-30T11:50:00.000Z"
    }
  }
}
```

---

### 2. Create/Update Member

Create a new member or update an existing one.

**POST** `/api/sync/members`

#### Create New Member

```json
{
  "id": "clx123...",  // Optional - portal can generate
  "birthdate": "1990-05-15T00:00:00.000Z",
  "first_name": "John",
  "last_name": "Flett",
  "t_number": "TCN-12345",
  "deceased": null,
  "profile": {
    "gender": "M",
    "o_r_status": "On-Reserve",
    "community": "Split Lake",
    "address": "123 Main St",
    "phone_number": "(204) 555-1234",
    "email": "john.flett@email.com"
  },
  "barcode": {
    "barcode": "TCN123456789",
    "activated": 1
  },
  "family": {
    "spouse_fname": "Jane",
    "spouse_lname": "Flett",
    "dependents": 2
  }
}
```

#### Update Existing Member

```json
{
  "id": "clx123...",
  "first_name": "Jonathan",  // Updated name
  "last_name": "Flett"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member created successfully",
  "data": {
    "id": "clx123...",
    "first_name": "John",
    "last_name": "Flett",
    // ... full member object with relations
  }
}
```

---

### 3. Delta Sync (Get Updated Members)

Get all members updated since a specific timestamp. Useful for syncing changes back to master.

**GET** `/api/sync/members?since=2025-11-30T00:00:00.000Z&limit=100`

**Query Parameters:**
- `since` - ISO timestamp (required for meaningful results)
- `limit` - Max records to return (default: 100, max: 1000)
- `cursor` - Pagination cursor for next page

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "clx123...",
        "first_name": "John",
        "last_name": "Flett",
        "t_number": "TCN-12345",
        "activated": "ACTIVATED",
        "updated": "2025-11-30T11:55:00.000Z",
        "profile": [...],
        "barcode": [...],
        "family": [...]
      }
    ],
    "pagination": {
      "count": 50,
      "nextCursor": "clx456...",
      "hasMore": true
    }
  }
}
```

---

### 4. Mark Member Deceased

Mark a member as deceased. This is a soft delete - the record remains but is flagged.

**DELETE** `/api/sync/members`

```json
{
  "memberId": "clx123...",  // OR use t_number
  "t_number": "TCN-12345",  // Alternative identifier
  "deceasedDate": "2025-11-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member marked as deceased",
  "data": {
    "id": "clx123...",
    "deceased": "2025-11-15"
  }
}
```

---

### 5. Batch Sync

Process multiple operations in a single request. Ideal for bulk updates.

**POST** `/api/sync/batch`

```json
{
  "syncId": "550e8400-e29b-41d4-a716-446655440000",  // Optional - for tracking
  "timestamp": "2025-11-30T12:00:00.000Z",
  "source": "master",
  "items": [
    {
      "operation": "CREATE",
      "model": "fnmember",
      "data": {
        "id": "clx123...",
        "birthdate": "1990-05-15T00:00:00.000Z",
        "first_name": "John",
        "last_name": "Flett",
        "t_number": "TCN-12345"
      }
    },
    {
      "operation": "UPDATE",
      "model": "Profile",
      "data": {
        "id": "clp456...",
        "phone_number": "(204) 555-9999"
      }
    },
    {
      "operation": "UPSERT",
      "model": "Barcode",
      "data": {
        "id": "clb789...",
        "barcode": "TCN987654321",
        "activated": 1,
        "fnmemberId": "clx123..."
      }
    },
    {
      "operation": "DELETE",
      "model": "Family",
      "id": "clf012..."
    }
  ]
}
```

**Operations:**
- `CREATE` - Create new record (fails if exists)
- `UPDATE` - Update existing record (fails if not exists)
- `UPSERT` - Create or update (always succeeds)
- `DELETE` - Delete record

**Models:**
- `fnmember` - Main member record
- `Profile` - Member profile info
- `Barcode` - Member barcode
- `Family` - Family information

**Response:**
```json
{
  "success": true,
  "message": "Batch sync completed: 4 processed, 0 failed",
  "data": {
    "syncId": "550e8400-e29b-41d4-a716-446655440000",
    "processed": 4,
    "failed": 0,
    "total": 4
  }
}
```

---

### 6. Pull Portal Updates (Portal → Master)

Pull Profile and Family data that members have updated on the portal. **This is how the master database gets updated contact information from members.**

**GET** `/api/sync/pull`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `models` | string | `Profile,Family` | Comma-separated: `Profile`, `Family`, or both |
| `since` | ISO datetime | - | Only records updated after this timestamp |
| `limit` | number | `100` | Max records per request (1-500) |
| `cursor` | string | - | Pagination cursor for next page |

**Example - Get all profile updates since last sync:**
```bash
curl -H "x-api-key: YOUR_KEY" \
  "https://portal.tcn.ca/api/sync/pull?models=Profile&since=2025-11-01T00:00:00.000Z"
```

**Response:**
```json
{
  "success": true,
  "message": "Portal data retrieved successfully",
  "data": {
    "profiles": [
      {
        "id": "clp123...",
        "created": "2025-01-15T10:00:00.000Z",
        "updated": "2025-11-28T14:30:00.000Z",
        "gender": "F",
        "o_r_status": "On-Reserve",
        "community": "Split Lake",
        "address": "456 New Address St",
        "phone_number": "(204) 555-9876",
        "email": "updated.email@example.com",
        "image_url": "/profiles/clx123.jpg",
        "fnmemberId": "clx123...",
        "member": {
          "id": "clx123...",
          "t_number": "TCN-12345",
          "name": "Jane Flett"
        }
      }
    ],
    "pagination": {
      "hasMore": false,
      "totalReturned": 1
    }
  },
  "query": {
    "since": "2025-11-01T00:00:00.000Z",
    "models": ["Profile"],
    "limit": 100
  }
}
```

**Example - Get all family updates:**
```bash
curl -H "x-api-key: YOUR_KEY" \
  "https://portal.tcn.ca/api/sync/pull?models=Family&since=2025-11-01T00:00:00.000Z"
```

**Response:**
```json
{
  "success": true,
  "message": "Portal data retrieved successfully",
  "data": {
    "families": [
      {
        "id": "clf456...",
        "created": "2025-01-15T10:00:00.000Z",
        "updated": "2025-11-29T09:15:00.000Z",
        "spouse_fname": "John",
        "spouse_lname": "Flett",
        "dependents": 3,
        "fnmemberId": "clx123...",
        "member": {
          "id": "clx123...",
          "t_number": "TCN-12345",
          "name": "Jane Flett"
        }
      }
    ],
    "pagination": {
      "hasMore": false,
      "totalReturned": 1
    }
  }
}
```

**Pagination Example:**
```bash
# First request
curl -H "x-api-key: YOUR_KEY" "https://portal.tcn.ca/api/sync/pull?limit=50"

# If hasMore is true, use nextCursor for next page
curl -H "x-api-key: YOUR_KEY" \
  "https://portal.tcn.ca/api/sync/pull?limit=50&cursor=clp789..."
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid API key",
  "timestamp": "2025-11-30T12:00:00.000Z"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["first_name"],
      "message": "Required"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Member not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "A member with this t_number already exists"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

---

## Important Notes

### What the Portal Manages Independently

1. **`fnauth` model** - Portal-only authentication
   - Login credentials
   - Password resets
   - Session management

2. **`activated` field on fnmember**
   - Portal manages account activation status
   - Master should NOT sync this field

3. **Profile images** (`image_url` in Profile)
   - Uploaded through portal
   - Master can sync other profile fields

### Sync Strategy Recommendations

1. **Master → Portal (Push)**
   - New members created in master
   - Member info updates (name changes, corrections)
   - Deceased status updates
   - Use batch endpoint for bulk operations

2. **Portal → Master (Pull)**
   - Use delta sync to get updated profiles
   - Portal users may update contact info
   - Master can pull these changes periodically

3. **Conflict Resolution**
   - Master is authoritative for: `first_name`, `last_name`, `birthdate`, `t_number`, `deceased`
   - Portal is authoritative for: `activated` (account status), `fnauth` (credentials)
   - Either can update: Profile contact info (resolve by timestamp)

---

## Example: Master Database Client

```typescript
// sync-client.ts - For use in Master Database Manager

const API_BASE = 'https://portal.tcn.ca/api/sync';
const API_KEY = process.env.PORTAL_API_KEY;

async function syncToPortal(endpoint: string, method: string, body?: any) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY!,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return response.json();
}

// Create new member
export async function createMember(member: NewMember) {
  return syncToPortal('/members', 'POST', member);
}

// Update member
export async function updateMember(id: string, updates: Partial<Member>) {
  return syncToPortal('/members', 'POST', { id, ...updates });
}

// Mark deceased
export async function markDeceased(t_number: string, deceasedDate: string) {
  return syncToPortal('/members', 'DELETE', { t_number, deceasedDate });
}

// Batch sync
export async function batchSync(items: SyncItem[]) {
  return syncToPortal('/batch', 'POST', {
    syncId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: 'master',
    items,
  });
}

// ========== PULL FROM PORTAL (Portal → Master) ==========

// Pull Profile updates (member-edited contact info)
export async function pullProfileUpdates(since?: Date) {
  const params = new URLSearchParams({
    models: 'Profile',
    limit: '100',
  });
  if (since) params.append('since', since.toISOString());
  return syncToPortal(`/pull?${params}`, 'GET');
}

// Pull Family updates
export async function pullFamilyUpdates(since?: Date) {
  const params = new URLSearchParams({
    models: 'Family',
    limit: '100',
  });
  if (since) params.append('since', since.toISOString());
  return syncToPortal(`/pull?${params}`, 'GET');
}

// Pull all member-editable data
export async function pullAllMemberData(since?: Date) {
  const params = new URLSearchParams({
    models: 'Profile,Family',
    limit: '100',
  });
  if (since) params.append('since', since.toISOString());
  return syncToPortal(`/pull?${params}`, 'GET');
}
```

---

## Environment Variables

Add to `.env` in both applications:

**Portal (.env):**
```env
# API Keys (comma-separated for multiple keys)
API_KEYS="key1,key2,key3"
```

**Master Database Manager (.env):**
```env
PORTAL_API_KEY="your-api-key-here"
PORTAL_API_URL="https://portal.tcn.ca/api/sync"
```

---

## Generating New API Keys

```bash
# Generate a secure random key
openssl rand -hex 32

# Or in Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the generated key to the portal's `API_KEYS` environment variable.
