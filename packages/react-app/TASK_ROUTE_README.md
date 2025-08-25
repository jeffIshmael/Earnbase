# Dynamic Task Route - `/Task/[id]`

## Overview
This document describes the new dynamic route for individual tasks that displays task details, subtasks, and a participant leaderboard.

## Route Structure

### Main Route: `/Task/[id]`
- **File**: `app/Task/[id]/page.tsx`
- **Dynamic Parameter**: `[id]` - Task ID from the database
- **Purpose**: Display detailed information about a specific task

### Supporting Files
- **Loading**: `app/Task/[id]/loading.tsx` - Loading skeleton while fetching task data
- **Error**: `app/Task/[id]/error.tsx` - Error boundary for task loading failures
- **Not Found**: `app/Task/[id]/not-found.tsx` - 404 page for non-existent tasks
- **Layout**: `app/Task/layout.tsx` - Layout wrapper for all task routes

## Features

### 1. **Task Overview Tab**
- Task title and description
- Creator information
- Participant count and budget
- Expiration date (if set)
- Active restrictions display
- AI rating criteria

### 2. **Subtasks Tab**
- Complete list of task subtasks
- Subtask type and requirements
- Order and description
- Required/optional indicators

### 3. **Leaderboard Tab**
- Participant rankings based on AI scores
- Trophy icons for top 3 positions
- Score display (1-10 scale)
- Join dates and reward amounts
- Submission status

### 4. **Responsive Design**
- Mobile-first layout
- Tabbed navigation for content organization
- Smooth transitions and hover effects
- Bottom navigation integration

## Data Flow

### 1. **Route Access**
```
Marketplace → Task Card → /Task/[id] → Task Detail Page
```

### 2. **Data Fetching**
- Uses `getTaskDetails()` from Prismafnctns
- Fetches task, creator, subtasks, and submissions
- Handles loading states and errors

### 3. **Data Display**
- Real-time data from database
- Dynamic leaderboard calculation
- Responsive UI updates

## Integration Points

### Marketplace Integration
- **Updated**: `app/Marketplace/page.tsx`
- **New Features**: 
  - Search and filter tasks
  - Sort by newest, reward, or popularity
  - Clickable task cards linking to `/Task/[id]`
  - Real-time task data display

### Database Integration
- **Primary Function**: `getTaskDetails(taskId)` from Prismafnctns
- **Data Models**: Task, TaskSubtask, TaskSubmission, User
- **Relationships**: Creator, participants, subtasks, responses

## Navigation

### Tab System
1. **Overview** - Task information and restrictions
2. **Subtasks** - Task breakdown and requirements
3. **Leaderboard** - Participant rankings and scores

### Mobile Navigation
- Sticky header with back button
- Bottom navigation component
- Touch-friendly tab switching

## Error Handling

### Loading States
- Skeleton loading components
- Spinner animations
- Progressive content reveal

### Error States
- Network error handling
- Task not found scenarios
- Graceful fallbacks

### User Experience
- Clear error messages
- Retry functionality
- Navigation alternatives

## Styling

### Design System
- Consistent with app theme
- Glassmorphism effects
- Gradient backgrounds
- Icon integration (Lucide React)

### Responsive Breakpoints
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interactions

## Performance

### Optimization
- Lazy loading of tab content
- Efficient data fetching
- Minimal re-renders
- Optimized images and icons

### Caching
- Client-side state management
- Efficient data structures
- Minimal API calls

## Usage Examples

### Direct Navigation
```typescript
// Navigate to specific task
router.push(`/Task/${taskId}`);

// Link component
<Link href={`/Task/${task.id}`}>View Task</Link>
```

### Data Access
```typescript
// Get task details
const task = await getTaskDetails(taskId);

// Access task properties
const { title, description, subtasks, submissions } = task;
```

## Future Enhancements

### Planned Features
- Task participation functionality
- Real-time updates
- Comment system
- File upload support
- Advanced filtering

### Scalability
- Pagination for large leaderboards
- Virtual scrolling for many subtasks
- Caching strategies
- Performance monitoring

## Technical Details

### Dependencies
- Next.js 14 App Router
- React 18 with hooks
- Prisma for database access
- Tailwind CSS for styling
- Lucide React for icons

### File Structure
```
app/Task/
├── [id]/
│   ├── page.tsx          # Main task detail page
│   ├── loading.tsx       # Loading skeleton
│   ├── error.tsx         # Error boundary
│   └── not-found.tsx     # 404 page
└── layout.tsx            # Task section layout
```

This dynamic route provides a comprehensive view of individual tasks with an intuitive interface for users to explore task details, understand requirements, and track participant performance. 