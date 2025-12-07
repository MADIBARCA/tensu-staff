import { useState, useEffect, useMemo } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { ClubCard } from './components/ClubCard';
import { ClubDetailsModal } from './components/ClubDetailsModal';

export interface Club {
  id: number;
  name: string;
  address: string;
  sections_count: number;
  students_count: number;
  tags: string[];
  logo_url?: string;
  phone?: string;
  telegram_url?: string;
  whatsapp_url?: string;
  working_hours?: string;
  description?: string;
}

export default function ClubsPage() {
  const { t } = useI18n();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'my'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await clubsApi.getAll(token);
        // setClubs(response.data);
        
        // Mock data for demo
        const mockClubs: Club[] = [
          {
            id: 1,
            name: 'Спортивный клуб "Чемпион"',
            address: 'г. Алматы, ул. Абая, 150',
            sections_count: 5,
            students_count: 120,
            tags: ['football', 'basketball', 'volleyball'],
            logo_url: '',
            phone: '+7 777 123 45 67',
            telegram_url: 'https://t.me/champion_club',
            whatsapp_url: 'https://wa.me/77771234567',
            working_hours: 'Пн-Пт: 07:00-22:00, Сб-Вс: 09:00-20:00',
            description: 'Современный спортивный клуб с профессиональными тренерами и новейшим оборудованием.',
          },
          {
            id: 2,
            name: 'Фитнес центр "Сила"',
            address: 'г. Алматы, пр. Достык, 240',
            sections_count: 8,
            students_count: 250,
            tags: ['fitness', 'yoga', 'pilates', 'gym'],
            logo_url: '',
            phone: '+7 777 987 65 43',
            telegram_url: 'https://t.me/sila_fitness',
            working_hours: 'Ежедневно: 06:00-23:00',
            description: 'Лучший фитнес центр города с бассейном и SPA.',
          },
          {
            id: 3,
            name: 'Бассейн "Волна"',
            address: 'г. Алматы, ул. Жандосова, 58',
            sections_count: 3,
            students_count: 80,
            tags: ['swimming', 'aqua-aerobics', 'water-polo'],
            logo_url: '',
            phone: '+7 777 111 22 33',
            working_hours: 'Пн-Пт: 06:00-22:00, Сб-Вс: 08:00-20:00',
            description: 'Олимпийский бассейн с квалифицированными инструкторами.',
          },
          {
            id: 4,
            name: 'Теннисный клуб "Ас"',
            address: 'г. Алматы, мкр. Самал-2, 15',
            sections_count: 2,
            students_count: 45,
            tags: ['tennis', 'badminton'],
            logo_url: '',
            phone: '+7 777 444 55 66',
            working_hours: 'Ежедневно: 07:00-21:00',
            description: 'Профессиональные корты для большого тенниса и бадминтона.',
          },
          {
            id: 5,
            name: 'Боксёрский клуб "Arlan Box"',
            address: 'г. Алматы, ул. Толе би, 300',
            sections_count: 4,
            students_count: 95,
            tags: ['boxing', 'kickboxing', 'mma'],
            logo_url: '',
            phone: '+7 777 777 88 99',
            working_hours: 'Пн-Сб: 08:00-21:00',
            description: 'Легендарный клуб бокса с чемпионами мира среди тренеров.',
          },
        ];
        
        setClubs(mockClubs);
        // Mock: User has memberships in clubs 1 and 2
        setMyClubIds([1, 2]);
      } catch (error) {
        console.error('Failed to load clubs:', error);
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, []);

  // Filter and search logic
  const filteredClubs = useMemo(() => {
    let result = clubs;

    // Apply filter
    if (filterType === 'my') {
      result = result.filter(club => myClubIds.includes(club.id));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(club => 
        club.name.toLowerCase().includes(query) ||
        club.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [clubs, filterType, searchQuery, myClubIds]);

  const handleClubClick = (club: Club) => {
    setSelectedClub(club);
  };

  if (loading) {
    return (
      <Layout title={t('clubs.title')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('clubs.title')}>
      <PageContainer>
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('clubs.search.placeholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} className="text-gray-600" />
              <span className="text-sm text-gray-700">
                {filterType === 'all' ? t('clubs.filter.all') : t('clubs.filter.my')}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    filterType === 'all' ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {t('clubs.filter.all')}
                </button>
                <button
                  onClick={() => {
                    setFilterType('my');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    filterType === 'my' ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {t('clubs.filter.my')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clubs List */}
        {filteredClubs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {filterType === 'my' 
                ? t('clubs.empty.my') 
                : searchQuery 
                  ? t('clubs.empty.search') 
                  : t('clubs.empty.all')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                isMember={myClubIds.includes(club.id)}
                onClick={() => handleClubClick(club)}
              />
            ))}
          </div>
        )}

        {/* Club Details Modal */}
        {selectedClub && (
          <ClubDetailsModal
            club={selectedClub}
            isMember={myClubIds.includes(selectedClub.id)}
            onClose={() => setSelectedClub(null)}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
