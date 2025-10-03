
import {
  CheckCircle2,
  XCircle,
  Newspaper,
  Video,
  AudioWaveform,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  BarChart,
  Check,
  HelpCircle,
  Image,
} from 'lucide-react';

export const Icons = {
  checkCircle: CheckCircle2,
  xCircle: XCircle,
  news: Newspaper,
  video: Video,
  audio: AudioWaveform,
  shield: ShieldCheck,
  spinner: (props: { className?: string }) => <Loader2 className={cn('animate-spin', props.className)} />,
  alert: AlertTriangle,
  barChart: BarChart,
  check: Check,
  help: HelpCircle,
  image: Image,
  google: (props: { className?: string }) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Google</title>
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.95-4.25 1.95-3.52 0-6.33-2.88-6.33-6.4s2.81-6.4 6.33-6.4c1.9 0 3.21.73 4.1 1.62l2.33-2.33C18.13 2.16 15.47 1 12.48 1 7.02 1 3 5.02 3 10.5s4.02 9.5 9.48 9.5c2.73 0 4.95-.93 6.6-2.6l.1-.1c1.78-1.78 2.4-4.28 2.4-6.88 0-.6-.05-1.12-.15-1.62H12.48z" />
    </svg>
  ),
};

function cn(...inputs: any[]) {
    // A simplified cn for internal use, as full cn is not needed here.
    return inputs.filter(Boolean).join(' ');
}
