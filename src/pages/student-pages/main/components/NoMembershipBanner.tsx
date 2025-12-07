import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { CreditCard, ArrowRight } from 'lucide-react';

export const NoMembershipBanner: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="bg-white bg-opacity-20 rounded-full p-3">
          <CreditCard size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {t('home.noMembership.title')}
          </h3>
          <p className="text-sm text-blue-50 mb-4">
            {t('home.noMembership.description')}
          </p>
          <button
            onClick={() => navigate('/student/clubs')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            {t('home.noMembership.findClub')}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
};
