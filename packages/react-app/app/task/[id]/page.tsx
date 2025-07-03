
import TaskPage from '../TaskPage';
interface PageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }:PageProps) {
  return <TaskPage taskId={params.id} />;
}
