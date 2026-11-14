export interface StudentLiveClass {
  id: string;
  title: string;
  description: string;
  courseSlug: string;
  courseTitle: string;
  host: { id: string; name: string; role: string };
  startsAt: string;
  endsAt: string;
  durationMin: number;
  maxStudents: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  features: { chat: boolean; handRaise: boolean; polls: boolean; reactions: boolean; studentCamera: boolean; recording: boolean };
  resources: { title: string; url: string }[];
  studentsNow: number;
  hostPresent: boolean;
  joinOpensAt: string;
  recordingUrl: string;
  enrolled: boolean;
}