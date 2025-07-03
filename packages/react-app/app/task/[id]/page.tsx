// REMOVE 'use client'; ✅ this should be a server component

import TaskPage from './TaskPage';

export default function Page({ params }: { params: { id: string } }) {
  return <TaskPage taskId={params.id} />;
}
