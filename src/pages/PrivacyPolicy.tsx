import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';

export default function PrivacyPolicy() {
  const { t } = useI18n();

  return (
    <Layout title={t('settings.privacy')} showBackButton>
      <PageContainer>
        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mb-4">Политика конфиденциальности</h2>
          <p className="text-gray-700 mb-4">
            Здесь будет размещена политика конфиденциальности приложения Tensu Students.
          </p>
          {/* TODO: Add actual privacy policy content */}
        </div>
      </PageContainer>
    </Layout>
  );
}
