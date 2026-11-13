export interface NoteInfo {
  note: string;
  label: string;
  color: string;
  isBlack?: boolean;
}

export const PIANO_KEYS: NoteInfo[] = [
  { note: 'C4', label: 'C', color: '#EF4444' },
  { note: 'C#4', label: 'C#', color: '#000000', isBlack: true },
  { note: 'D4', label: 'D', color: '#F59E0B' },
  { note: 'D#4', label: 'D#', color: '#000000', isBlack: true },
  { note: 'E4', label: 'E', color: '#10B981' },
  { note: 'F4', label: 'F', color: '#3B82F6' },
  { note: 'F#4', label: 'F#', color: '#000000', isBlack: true },
  { note: 'G4', label: 'G', color: '#8B5CF6' },
  { note: 'G#4', label: 'G#', color: '#000000', isBlack: true },
  { note: 'A4', label: 'A', color: '#EC4899' },
  { note: 'A#4', label: 'A#', color: '#000000', isBlack: true },
  { note: 'B4', label: 'B', color: '#6B7280' },
  { note: 'C5', label: 'C', color: '#EF4444' },
  { note: 'C#5', label: 'C#', color: '#000000', isBlack: true },
  { note: 'D5', label: 'D', color: '#F59E0B' },
  { note: 'D#5', label: 'D#', color: '#000000', isBlack: true },
  { note: 'E5', label: 'E', color: '#10B981' },
  { note: 'F5', label: 'F', color: '#3B82F6' },
  { note: 'F#5', label: 'F#', color: '#000000', isBlack: true },
  { note: 'G5', label: 'G', color: '#8B5CF6' },
  { note: 'G#5', label: 'G#', color: '#000000', isBlack: true },
  { note: 'A5', label: 'A', color: '#EC4899' },
  { note: 'A#5', label: 'A#', color: '#000000', isBlack: true },
  { note: 'B5', label: 'B', color: '#6B7280' },
  { note: 'C6', label: 'C', color: '#EF4444' },
];

export interface SongNote {
  note: string;
  display: string;
}

export interface SongSchema {
  id: string;
  title: string;
  artist: string;
  notes: SongNote[];
  difficulty: number; // 1-5 scale
  bpm: number;
}

export const SONGS: SongSchema[] = [
  {
    id: 'elise',
    title: 'Für Elise',
    artist: 'Beethoven',
    difficulty: 3,
    bpm: 125,
    notes: [
      { note: 'E5', display: 'E5' }, { note: 'D#5', display: 'D#' }, { note: 'E5', display: 'E5' }, { note: 'D#5', display: 'D#' },
      { note: 'E5', display: 'E5' }, { note: 'B4', display: 'B4' }, { note: 'D5', display: 'D5' }, { note: 'C5', display: 'C5' }, { note: 'A4', display: 'A4' },
      { note: 'C4', display: 'C4' }, { note: 'E4', display: 'E4' }, { note: 'A4', display: 'A4' }, { note: 'B4', display: 'B4' },
      { note: 'E4', display: 'E4' }, { note: 'G#4', display: 'G#' }, { note: 'B4', display: 'B4' }, { note: 'C5', display: 'C5' },
      { note: 'E4', display: 'E4' }, { note: 'E5', display: 'E5' }, { note: 'D#5', display: 'D#' }, { note: 'E5', display: 'E5' }, { note: 'D#5', display: 'D#' },
      { note: 'E5', display: 'E5' }, { note: 'B4', display: 'B4' }, { note: 'D5', display: 'D5' }, { note: 'C5', display: 'C5' }, { note: 'A4', display: 'A4' },
      { note: 'C4', display: 'C4' }, { note: 'E4', display: 'E4' }, { note: 'A4', display: 'A4' }, { note: 'B4', display: 'B4' },
      { note: 'E4', display: 'E4' }, { note: 'C5', display: 'C5' }, { note: 'B4', display: 'B4' }, { note: 'A4', display: 'A4' },
    ]
  },
  {
    id: 'turkish',
    title: 'Turkish March',
    artist: 'Mozart',
    difficulty: 5,
    bpm: 140,
    notes: [
      { note: 'B4', display: 'B' }, { note: 'A#4', display: 'A#' }, { note: 'B4', display: 'B' }, { note: 'C5', display: 'C' },
      { note: 'D5', display: 'D' }, { note: 'E5', display: 'E' }, { note: 'D5', display: 'D' }, { note: 'C5', display: 'C' },
      { note: 'B4', display: 'B' }, { note: 'A4', display: 'A' }, { note: 'G4', display: 'G' }, { note: 'A4', display: 'A' },
      { note: 'B4', display: 'B' }, { note: 'A4', display: 'A' }, { note: 'G4', display: 'G' }, { note: 'F4', display: 'F' }, { note: 'E4', display: 'E' },
      { note: 'E4', display: 'E' }, { note: 'F4', display: 'F' }, { note: 'G4', display: 'G' }, { note: 'A4', display: 'A' }, { note: 'B4', display: 'B' },
      { note: 'C5', display: 'C' }, { note: 'D5', display: 'D' }, { note: 'E5', display: 'E' }, { note: 'D5', display: 'D' }, { note: 'C5', display: 'C' },
      { note: 'B4', display: 'B' }, { note: 'E5', display: 'E' }, { note: 'D5', display: 'D' }, { note: 'C5', display: 'C' }, { note: 'B4', display: 'B' }, { note: 'A4', display: 'A' },
    ]
  },
  {
    id: 'ode',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    difficulty: 1,
    bpm: 100,
    notes: [
      { note: 'E4', display: 'E' }, { note: 'E4', display: 'E' }, { note: 'F4', display: 'F' }, { note: 'G4', display: 'G' },
      { note: 'G4', display: 'G' }, { note: 'F4', display: 'F' }, { note: 'E4', display: 'E' }, { note: 'D4', display: 'D' },
      { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' }, { note: 'D4', display: 'D' }, { note: 'E4', display: 'E' },
      { note: 'E4', display: 'E' }, { note: 'D4', display: 'D' }, { note: 'D4', display: 'D' },
      { note: 'E4', display: 'E' }, { note: 'E4', display: 'E' }, { note: 'F4', display: 'F' }, { note: 'G4', display: 'G' },
      { note: 'G4', display: 'G' }, { note: 'F4', display: 'F' }, { note: 'E4', display: 'E' }, { note: 'D4', display: 'D' },
      { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' }, { note: 'D4', display: 'D' }, { note: 'E4', display: 'E' },
      { note: 'D4', display: 'D' }, { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' },
    ]
  },
  {
    id: 'danube',
    title: 'The Blue Danube',
    artist: 'Strauss II',
    difficulty: 2,
    bpm: 110,
    notes: [
      { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' }, { note: 'E4', display: 'E' }, { note: 'G4', display: 'G' }, { note: 'G4', display: 'G' },
      { note: 'E4', display: 'E' }, { note: 'E4', display: 'E' }, { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' },
      { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' }, { note: 'E4', display: 'E' }, { note: 'G4', display: 'G' }, { note: 'G4', display: 'G' },
      { note: 'F4', display: 'F' }, { note: 'F4', display: 'F' }, { note: 'D4', display: 'D' }, { note: 'D4', display: 'D' },
      { note: 'D4', display: 'D' }, { note: 'D4', display: 'D' }, { note: 'F4', display: 'F' }, { note: 'A4', display: 'A' }, { note: 'A4', display: 'A' },
      { note: 'F4', display: 'F' }, { note: 'F4', display: 'F' }, { note: 'D4', display: 'D' }, { note: 'D4', display: 'D' },
      { note: 'D4', display: 'D' }, { note: 'D4', display: 'D' }, { note: 'F4', display: 'F' }, { note: 'A4', display: 'A' }, { note: 'A4', display: 'A' },
      { note: 'E4', display: 'E' }, { note: 'E4', display: 'E' }, { note: 'C4', display: 'C' }, { note: 'C4', display: 'C' },
    ]
  },
  {
    id: 'tell',
    title: 'William Tell Overture',
    artist: 'Rossini',
    difficulty: 4,
    bpm: 150,
    notes: [
      { note: 'G4', display: 'G' }, { note: 'G4', display: 'G' }, { note: 'G4', display: 'G' }, { note: 'C5', display: 'C' },
      { note: 'G4', display: 'G' }, { note: 'G4', display: 'G' }, { note: 'G4', display: 'G' }, { note: 'E5', display: 'E' },
      { note: 'C5', display: 'C' }, { note: 'B4', display: 'B' }, { note: 'C5', display: 'C' }, { note: 'D5', display: 'D' },
      { note: 'E5', display: 'E' }, { note: 'D5', display: 'D' }, { note: 'E5', display: 'E' }, { note: 'F5', display: 'F' },
      { note: 'G5', display: 'G' }, { note: 'G5', display: 'G' }, { note: 'G5', display: 'G' },
      { note: 'G5', display: 'G' }, { note: 'F5', display: 'F' }, { note: 'E5', display: 'E' }, { note: 'D5', display: 'D' },
      { note: 'C5', display: 'C' }, { note: 'B4', display: 'B' }, { note: 'A4', display: 'A' }, { note: 'G4', display: 'G' },
      { note: 'C4', display: 'C' }, { note: 'E4', display: 'E' }, { note: 'G4', display: 'G' }, { note: 'C5', display: 'C' },
      { note: 'E5', display: 'E' }, { note: 'G5', display: 'G' }, { note: 'C6', display: 'C' }
    ]
  }
];

