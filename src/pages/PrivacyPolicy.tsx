import { Layout, PageContainer } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';

type TextBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

function parsePolicyText(input: string): TextBlock[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const blocks: TextBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    const text = para.join(' ').trim();
    if (text) blocks.push({ type: 'p', text });
    para = [];
  };

  const flushList = () => {
    if (list.length) blocks.push({ type: 'ul', items: list });
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith('- ')) {
      flushPara();
      list.push(line.slice(2).trim());
      continue;
    }
    flushList();
    para.push(line);
  }

  flushPara();
  flushList();
  return blocks;
}

function openTelegramLink(url: string) {
  const tg = window.Telegram?.WebApp;
  if (tg?.openLink) {
    tg.openLink(url, { try_instant_view: false });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function PrivacyPolicy() {
  const { t } = useI18n();

  const sections = [
    { key: 'privacy.section.1' },
    { key: 'privacy.section.2' },
    { key: 'privacy.section.3' },
    { key: 'privacy.section.4' },
    { key: 'privacy.section.5' },
    { key: 'privacy.section.6' },
    { key: 'privacy.section.7' },
    { key: 'privacy.section.8' },
    { key: 'privacy.section.9' },
    { key: 'privacy.section.10' },
  ] as const;

  return (
    <Layout title={t('settings.privacy')} showBackButton>
      <PageContainer className="space-y-4">
        <Card className="p-0 overflow-hidden">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('privacy.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('privacy.meta.effective')}</p>
            <p className="text-sm text-gray-700 mt-3">{t('privacy.intro')}</p>
          </div>
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600">{t('privacy.contact.text')}</p>
              <button
                type="button"
                onClick={() => openTelegramLink('https://t.me/tensuadmin')}
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-blue-600 font-medium hover:bg-gray-50 transition-colors"
              >
                @tensuadmin
              </button>
            </div>
          </div>
        </Card>

        {sections.map((s) => (
          <Card key={s.key} className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900">
              {t(`${s.key}.title`)}
            </h3>
            <div className="space-y-3">
              {parsePolicyText(t(`${s.key}.body`)).map((block, idx) => {
                if (block.type === 'p') {
                  return (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed">
                      {block.text}
                    </p>
                  );
                }
                return (
                  <ul
                    key={idx}
                    className="list-disc pl-5 space-y-1 text-sm text-gray-700"
                  >
                    {block.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                );
              })}
            </div>
          </Card>
        ))}

        <p className="text-xs text-gray-500 leading-relaxed">
          {t('privacy.footer')}
        </p>
      </PageContainer>
    </Layout>
  );
}
