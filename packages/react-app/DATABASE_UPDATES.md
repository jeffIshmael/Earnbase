# Database Updates for CreateTask Form

## Overview
This document outlines the database schema updates and new API functionality to support the enhanced CreateTask form with participant restrictions.

## Database Schema Changes

### Task Table Additions
The `Task` table now includes the following new fields for participant restrictions:

```sql
-- Restriction control fields
restrictionsEnabled BOOLEAN NOT NULL DEFAULT false
ageRestriction     BOOLEAN NOT NULL DEFAULT false
minAge             INTEGER
maxAge             INTEGER
genderRestriction  BOOLEAN NOT NULL DEFAULT false
gender             TEXT  -- 'M' or 'F'
countryRestriction BOOLEAN NOT NULL DEFAULT false
countries          TEXT  -- JSON array of country codes
```

### Indexes Added
Performance indexes have been added for restriction queries:
- `idx_task_restrictions` - Composite index for restriction flags
- `idx_task_age_range` - Index for age range queries
- `idx_task_gender` - Index for gender queries
- `idx_task_countries` - Index for country queries

## New Prisma Functions

### 1. `createCompleteTask()`
Creates a task and its subtasks in a single transaction:
```typescript
createCompleteTask(
  creatorAddress: string,
  taskData: TaskData,
  subtasks: SubtaskData[]
)
```

### 2. `getTasksWithRestrictions()`
Filters tasks based on user demographics:
```typescript
getTasksWithRestrictions(
  userAge?: number,
  userGender?: string,
  userCountry?: string
)
```

## API Endpoints

### POST `/api/create-task`
Creates a new task with all restrictions and subtasks.

**Request Body:**
```typescript
{
  creatorAddress: string;
  title: string;
  description: string;
  maxParticipants: number;
  baseReward: string;
  maxBonusReward: string;
  aiCriteria: string;
  contactMethod: ContactMethod;
  contactInfo: string;
  expiresAt?: string; // ISO date string
  
  // Restrictions
  restrictionsEnabled?: boolean;
  ageRestriction?: boolean;
  minAge?: number;
  maxAge?: number;
  genderRestriction?: boolean;
  gender?: string; // 'M' or 'F'
  countryRestriction?: boolean;
  countries?: string[];
  
  // Subtasks
  subtasks: Array<{
    title: string;
    description?: string;
    type: SubtaskType;
    required: boolean;
    options?: string;
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  task: Task;
  message: string;
}
```

## Migration Instructions

1. **Update Prisma Schema**: The schema has been updated with new fields
2. **Run Migration**: Execute the SQL migration file to add new columns
3. **Regenerate Prisma Client**: Run `npx prisma generate` to update the client
4. **Update Frontend**: The CreateTask form now submits to the new API endpoint

## Frontend Integration

The CreateTask form now:
- Collects all restriction data (age, gender, countries)
- Validates input before submission
- Submits to the new `/api/create-task` endpoint
- Handles success/error responses appropriately
- Resets form after successful submission

## Data Flow

1. **User fills form** → All fields including restrictions are captured
2. **Form validation** → Client-side validation ensures data integrity
3. **API submission** → Data sent to `/api/create-task` endpoint
4. **Database creation** → Task and subtasks created in single transaction
5. **Response handling** → Success/error feedback to user
6. **Form reset** → Form cleared for next use

## Benefits

- **Complete data capture**: All form fields are now stored in the database
- **Restriction filtering**: Tasks can be filtered based on participant demographics
- **Transaction safety**: Task and subtasks created atomically
- **Performance**: Indexed fields for efficient restriction queries
- **Scalability**: JSON storage for flexible country lists
- **Backward compatibility**: Existing tasks continue to work 