import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram, ContactRequestResult } from '@/hooks/useTelegram';
import { staffApi } from '@/functions/axios/axiosFunctions';
import { useI18n } from '@/i18n/i18n';
import { 
  Phone, 
  User, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Building2,
  Users,
  Calendar
} from 'lucide-react';

type OnboardingStep = 'welcome' | 'phone' | 'loading' | 'success' | 'error' | 'no-access';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, initDataRaw, requestContact, showAlert, hapticFeedback } = useTelegram();
  const { t } = useI18n();
  
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const [contactResponse, setContactResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [hasCheckedExisting, setHasCheckedExisting] = useState(false);

  // Animate card entrance
  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Set user data from Telegram
  useEffect(() => {
    if (!user) return;
    
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    setFullName(name);
    setAvatar(user.photo_url);
    
    if (user.phone_number) {
      setPhone(user.phone_number);
    }
  }, [user]);

  // Check if staff profile already exists
  useEffect(() => {
    if (!initDataRaw || hasCheckedExisting) return;
    
    setHasCheckedExisting(true);
    
    (async () => {
      try {
        const response = await staffApi.getMe(initDataRaw);
        
        if (response.data && response.data.id) {
          // User already exists, redirect to main page
          hapticFeedback('success');
          navigate('/staff/main', { replace: true });
        }
      } catch (err) {
        // User doesn't exist, continue with onboarding
        console.log('User not found, continuing with onboarding');
      }
    })();
  }, [initDataRaw, hasCheckedExisting, navigate, hapticFeedback]);

  // Request phone number from Telegram
  const handleRequestContact = useCallback(() => {
    setStep('loading');
    hapticFeedback('medium');
    
    requestContact((granted: boolean, result: ContactRequestResult) => {
      if (granted && result.response) {
        setContactResponse(result.response);
        
        if (result.responseUnsafe?.contact?.phone_number) {
          setPhone(result.responseUnsafe.contact.phone_number);
        }
        
        // Now create the staff profile
        createStaffProfile(result.response);
      } else {
        setStep('phone');
        hapticFeedback('error');
        showAlert(t('onboarding.phoneAccessDenied'));
      }
    });
  }, [requestContact, hapticFeedback, showAlert, t]);

  // Create staff profile
  const createStaffProfile = useCallback(async (contactInitData: string) => {
    if (!initDataRaw) {
      setStep('error');
      setError(t('onboarding.telegramError'));
      return;
    }

    try {
      const response = await staffApi.create(
        { contact_init_data: contactInitData, preferences: {} },
        initDataRaw
      );

      if (response.data) {
        hapticFeedback('success');
        setStep('success');
        
        // Navigate after short delay to show success
        setTimeout(() => {
          navigate('/staff/main', { replace: true });
        }, 1500);
      }
    } catch (err: unknown) {
      console.error('Error creating staff profile:', err);
      hapticFeedback('error');
      
      // Check if it's a 404 - meaning user is not invited to any club
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 404 || axiosError.response?.status === 403) {
          setStep('no-access');
          return;
        }
      }
      
      setStep('error');
      setError(t('onboarding.createError'));
    }
  }, [initDataRaw, hapticFeedback, navigate, t]);

  // Continue to main if already has phone
  const handleContinue = useCallback(() => {
    navigate('/staff/main', { replace: true });
  }, [navigate]);

  // Retry registration
  const handleRetry = useCallback(() => {
    setStep('welcome');
    setError(null);
    setContactResponse(null);
  }, []);

  // Loading state while checking user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/90 text-lg font-medium">{t('onboarding.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Logo/Brand */}
        <div className={`mb-8 transition-all duration-700 ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">T</span>
          </div>
          <h1 className="text-white text-2xl font-bold text-center">Tensu Staff</h1>
        </div>

        {/* Main Card */}
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Welcome Step */}
            {step === 'welcome' && (
              <div className="p-8">
                {/* Avatar and Welcome */}
                <div className="text-center mb-8">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt={fullName}
                      className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-100 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('onboarding.welcomeTitle', { name: fullName.split(' ')[0] || t('onboarding.guest') })}
                  </h2>
                  <p className="text-gray-600">
                    {t('onboarding.welcomeSubtitle')}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('onboarding.feature1Title')}</p>
                      <p className="text-sm text-gray-500">{t('onboarding.feature1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('onboarding.feature2Title')}</p>
                      <p className="text-sm text-gray-500">{t('onboarding.feature2Desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t('onboarding.feature3Title')}</p>
                      <p className="text-sm text-gray-500">{t('onboarding.feature3Desc')}</p>
                    </div>
                  </div>
                </div>

                {/* Phone Permission Notice */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    {t('onboarding.phonePermissionNotice')}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleRequestContact}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <Phone className="w-5 h-5" />
                  {t('onboarding.sharePhone')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* Loading Step */}
            {step === 'loading' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('onboarding.processing')}</h3>
                <p className="text-gray-600">{t('onboarding.processingDesc')}</p>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('onboarding.successTitle')}</h3>
                <p className="text-gray-600 mb-6">{t('onboarding.successDesc')}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('onboarding.redirecting')}
                </div>
              </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('onboarding.errorTitle')}</h3>
                <p className="text-gray-600 mb-6">{error || t('onboarding.errorDesc')}</p>
                <button
                  onClick={handleRetry}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {t('onboarding.tryAgain')}
                </button>
              </div>
            )}

            {/* No Access Step */}
            {step === 'no-access' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('onboarding.noAccessTitle')}</h3>
                <p className="text-gray-600 mb-6">{t('onboarding.noAccessDesc')}</p>
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-800">{t('onboarding.noAccessHint')}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {t('onboarding.tryAgain')}
                </button>
              </div>
            )}

            {/* Phone Input Step (fallback) */}
            {step === 'phone' && (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('onboarding.phoneTitle')}</h3>
                  <p className="text-gray-600">{t('onboarding.phoneDesc')}</p>
                </div>
                
                <button
                  onClick={handleRequestContact}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mb-4"
                >
                  <Phone className="w-5 h-5" />
                  {t('onboarding.sharePhone')}
                </button>
                
                <button
                  onClick={handleContinue}
                  className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {t('onboarding.skipForNow')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center transition-all duration-700 delay-200 ${showCard ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/60 text-sm">
            {t('onboarding.privacyNotice')}
          </p>
        </div>
      </div>
    </div>
  );
}
