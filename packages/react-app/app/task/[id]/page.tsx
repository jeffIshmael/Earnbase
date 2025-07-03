
import TaskPage from '../TaskPage';

export default function Page({ params }: { params: { id: string } }) {
  return <TaskPage taskId={params.id} />;
}
