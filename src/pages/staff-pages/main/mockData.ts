// Mock data for trainer main page
import type { Club, Section, Group, Trainer, Training } from './types';

export const mockClubs: Club[] = [
  { id: 1, name: 'Фитнес клуб "Сила"' },
  { id: 2, name: 'Спортивный клуб "Энергия"' },
  { id: 3, name: 'Тренажерный зал "Максимум"' },
];

export const mockSections: Section[] = [
  { id: 1, name: 'Йога', club_id: 1 },
  { id: 2, name: 'Пилатес', club_id: 1 },
  { id: 3, name: 'Кроссфит', club_id: 1 },
  { id: 4, name: 'Танцы', club_id: 2 },
  { id: 5, name: 'Бокс', club_id: 2 },
  { id: 6, name: 'Силовые тренировки', club_id: 3 },
];

export const mockGroups: Group[] = [
  { id: 1, name: 'Группа А (Начальный уровень)', section_id: 1 },
  { id: 2, name: 'Группа Б (Средний уровень)', section_id: 1 },
  { id: 3, name: 'Группа В (Продвинутый уровень)', section_id: 1 },
  { id: 4, name: 'Группа А', section_id: 2 },
  { id: 5, name: 'Группа Б', section_id: 2 },
  { id: 6, name: 'Группа А', section_id: 3 },
  { id: 7, name: 'Группа А', section_id: 4 },
  { id: 8, name: 'Группа А', section_id: 5 },
];

export const mockTrainers: Trainer[] = [
  { id: 1, name: 'Иванов Иван Иванович', club_id: 1 },
  { id: 2, name: 'Петрова Мария Сергеевна', club_id: 1 },
  { id: 3, name: 'Сидоров Петр Александрович', club_id: 1 },
  { id: 4, name: 'Козлова Анна Дмитриевна', club_id: 2 },
  { id: 5, name: 'Смирнов Алексей Викторович', club_id: 2 },
  { id: 6, name: 'Волкова Елена Николаевна', club_id: 3 },
];

// Generate mock trainings for current month
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const generateMockTrainings = (): Training[] => {
  const trainings: Training[] = [];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Generate trainings for different days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    
    // Skip Sundays (0) or add fewer trainings
    if (dayOfWeek === 0) continue;
    
    // Add 1-3 trainings per day
    const numTrainings = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numTrainings; i++) {
      const hour = 9 + Math.floor(Math.random() * 10); // 9:00 - 19:00
      const minute = Math.random() > 0.5 ? 0 : 30;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const club = mockClubs[Math.floor(Math.random() * mockClubs.length)];
      const section = mockSections.find(s => s.club_id === club.id) || mockSections[0];
      const group = mockGroups.find(g => g.section_id === section.id) || mockGroups[0];
      const trainer = mockTrainers.find(t => t.club_id === club.id) || mockTrainers[0];
      
      const trainingDateTime = new Date(`${date.toISOString().split('T')[0]}T${time}`);
      const now = new Date();
      
      let status: Training['status'] = 'scheduled';
      if (trainingDateTime < now) {
        // Check if training is in progress (within duration)
        const endTime = new Date(trainingDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration
        if (now >= trainingDateTime && now <= endTime) {
          status = 'in_progress';
        } else {
          status = 'completed';
        }
      }
      
      // Randomly cancel some past trainings
      if (trainingDateTime < now && Math.random() > 0.8) {
        status = 'cancelled';
      }
      
      trainings.push({
        id: trainings.length + 1,
        club_id: club.id,
        club_name: club.name,
        section_id: section.id,
        section_name: section.name,
        group_id: group.id,
        group_name: group.name,
        trainer_id: trainer.id,
        trainer_name: trainer.name,
        date: date.toISOString().split('T')[0],
        time,
        duration: 60,
        location: `Зал ${Math.floor(Math.random() * 5) + 1}`,
        max_participants: 15,
        current_participants: Math.floor(Math.random() * 15),
        status,
        training_type: Math.random() > 0.7 ? 'recurring' : 'single',
        notes: Math.random() > 0.7 ? 'Особые указания для тренировки' : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
  
  return trainings.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
};

export const mockTrainings: Training[] = generateMockTrainings();
