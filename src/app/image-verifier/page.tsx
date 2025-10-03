
'use client';

import dynamic from 'next/dynamic';
import Loading from '../loading';

const ImageVerifier = dynamic(
  () => import('@/components/image-verifier').then((mod) => mod.ImageVerifier),
  {
    loading: () => <Loading />,
  }
);

export default function ImageVerifierPage() {
  return (
    <div className="container py-8 flex flex-col items-center justify-center">
      <ImageVerifier />
    </div>
  );
}
