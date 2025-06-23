export interface Staff {
  id: string;
  name: string;
  surname: string;
  telegramUsername?: string;
  role: 'coach' | 'admin';
  sports: string[];
  clubs: string[];
  phone?: string;
  status: 'active' | 'blocked' | 'vacation';
}

export interface SportsSection {
  id: string;
  name: string;
  icon: string;
  description: string;
  telegramLink: string;
  coaches: string[];
  color: string;
}

export interface Filters {
  search: string;
  roles: string[];
  clubs: string[];
  sections: string[];
}

export interface NewStaff {
  role: string;
  phone: string;
  clubId: string;   
}

export interface NewSection {
  capacity: number;
  price: number;
  duration_min: number;
  coachId: number | null;
  tags: string[];
  schedule: [];
  clubId?: number;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ScheduleEntry {
  day: string;
  start: string;
  end: string;
}