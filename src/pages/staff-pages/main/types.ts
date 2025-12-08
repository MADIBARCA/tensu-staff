// Types for trainer main page

export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TrainingType = 'single' | 'recurring';

export interface Club {
  id: number;
  name: string;
}

export interface Section {
  id: number;
  name: string;
  club_id: number;
  coach_id?: number;
}

export interface Group {
  id: number;
  name: string;
  section_id: number;
}

export interface Trainer {
  id: number;
  name: string;
  club_id: number;
}

export interface Training {
  id: number;
  club_id: number;
  club_name: string;
  section_id: number;
  section_name: string;
  group_id?: number;
  group_name?: string;
  trainer_id: number;
  trainer_name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  location: string;
  max_participants?: number;
  current_participants: number;
  status: TrainingStatus;
  training_type: TrainingType;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Filters {
  clubId: number | null;
  trainerId: number | null;
}

export interface CreateTrainingData {
  club_id: number;
  section_id: number;
  group_id?: number;
  trainer_id: number;
  date: string;
  time: string;
  duration: number;
  location: string;
  max_participants?: number;
  notes?: string;
}

export interface UpdateTrainingData {
  date?: string;
  time?: string;
  trainer_id?: number;
  status?: TrainingStatus;
}
