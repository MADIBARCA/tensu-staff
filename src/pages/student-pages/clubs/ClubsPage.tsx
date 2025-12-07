import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { ClubCard } from './components/ClubCard';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import { useTelegram } from '@/hooks/useTelegram';
import { clubsApi } from '@/functions/axios/axiosFunctions';

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
  const { initDataRaw } = useTelegram();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'my'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const loadClubs = useCallback(async () => {
    if (!initDataRaw) {
      setLoading(false);
      return;
    }

    try {
      // Load user's clubs from API
      const response = await clubsApi.getMy(initDataRaw);
      
      if (response.data?.clubs) {
        const loadedClubs: Club[] = response.data.clubs.map(c => ({
          id: c.club.id,
          name: c.club.name,
          address: c.club.address || '',
          sections_count: 0,
          students_count: 0,
          tags: c.club.tags || [],
          logo_url: c.club.logo_url,
          phone: c.club.phone,
          telegram_url: c.club.telegram_link,
          whatsapp_url: c.club.whatsapp_link,
          working_hours: c.club.working_hours,
          description: c.club.description,
        }));
        
        setClubs(loadedClubs);
        setMyClubIds(loadedClubs.map(c => c.id));
      }
    } catch (error) {
      console.error('Failed to load clubs:', error);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, [initDataRaw]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

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
