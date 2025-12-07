import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';

export default function GroupsPage() {
  const { t } = useI18n();

  return (
    <Layout title={t('nav.groups')}>
      <PageContainer>
        <div className="text-center py-8">
          <p className="text-gray-600">Страница групп</p>
          <p className="text-sm text-gray-400 mt-2">Страница будет реализована согласно бизнес-анализу</p>
        </div>
      </PageContainer>
    </Layout>
  );
}
