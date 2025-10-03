
'use client';

import dynamic from 'next/dynamic';
import Loading from '../loading';

const AudioAuthenticator = dynamic(
  () => import('@/components/audio-authenticator').then((mod) => mod.AudioAuthenticator),
  {
    loading: () => <Loading />,
  }
);

export default function AudioAuthenticatorPage() {
  return (
    <div className="container py-8 flex flex-col items-center justify-center">
      <AudioAuthenticator />
    </div>
  );
}
