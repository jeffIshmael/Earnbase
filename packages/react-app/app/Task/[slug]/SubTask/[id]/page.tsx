'use client';

import React, { use } from 'react';
import Task1Form from '@/components/Forms/Task1';
import Task2Form from '@/components/Forms/Task2';
import Task3Form from '@/components/Forms/Task3';
import Task4Form from '@/components/Forms/Task4';
import Task5Form from '@/components/Forms/Task5';
import Task6Form from '@/components/Forms/Task6';

const Page = ({ params }: { params: Promise<{ slug: string; id: string }> }) => {
  const { slug,id } = use(params);

  const renderTask = () => {
    switch (id) {
      case '1':
        return <Task1Form id={id} />;
      case '2':
        return <Task2Form id={id} />;
      case '3':
        return <Task3Form id={id} />;
      case '4':
        return <Task4Form />;
      case '5':
        return <Task5Form id={id} />;
      case '6':
        return <Task6Form />;
      default:
        return (
          <div className="p-4 text-center text-red-500 font-semibold">
            Invalid task ID. Please check your URL.
          </div>
        );
    }
  };

  return <div>{renderTask()}</div>;
};

export default Page;
