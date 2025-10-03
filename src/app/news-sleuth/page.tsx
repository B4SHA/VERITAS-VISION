
'use client';

import dynamic from 'next/dynamic';
import Loading from '../loading';

const NewsSleuth = dynamic(
  () => import('@/components/news-sleuth').then((mod) => mod.NewsSleuth),
  {
    loading: () => <Loading />,
  }
);


export default function NewsSleuthPage() {
  return (
    <div className="container py-8 flex flex-col items-center justify-center">
      <NewsSleuth />
    </div>
  );
}
