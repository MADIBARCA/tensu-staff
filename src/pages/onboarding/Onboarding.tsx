/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AsYouType } from "libphonenumber-js";
import OnboardingBgImg from "@/assets/onboarding-bg.png";
import { useTelegram } from "@/hooks/useTelegram";
import { staffApi } from "@/functions/axios/axiosFunctions";
import { useI18n } from "@/i18n/i18n";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, sendData } = useTelegram();
  const { t } = useI18n();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [tg, setTg] = useState<any>(null);
  const [showCard, setShowCard] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);

  // Flag to ensure checkStaffExists is called only once
  const [hasChecked, setHasChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showInvitationAlert, setShowInvitationAlert] = useState(false);

  // Smooth card appearance
  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Once we have the token, check if profile exists
  useEffect(() => {
    if (token && !hasChecked) {
      setHasChecked(true);
      (async () => {
        try {
          const resp = await staffApi.getMe(token);
          if ((resp.status === 200 || resp.status === 201) && resp.data) {
            localStorage.setItem(
              "telegramUser",
              JSON.stringify(resp.data.username)
            );
            localStorage.setItem(
              "telegramFullName",
              resp.data.first_name + " " + resp.data.last_name
            );
            localStorage.setItem("telegramPhone", resp.data.phone_number);
            localStorage.setItem("telegramAvatar", resp.data.photo_url || "");
            localStorage.setItem(
              "telegramId",
              resp.data.telegram_id.toString()
            );
            localStorage.setItem("telegramToken", token || "");
            localStorage.setItem("userId", resp.data.id.toString());
            
            // User already exists, navigate to main page
            navigate("/staff/main");
          }
        } catch (e) {
          console.error("getMe error:", e);
          // User doesn't exist yet, stay on onboarding
        }
      })();
    }
  }, [token, hasChecked, navigate]);

  // Initialize Telegram WebApp - only set token, don't call API
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const telegramApp = window.Telegram.WebApp;
      telegramApp.ready();
      telegramApp.expand();
      setTg(telegramApp);

      const rawInitData =
        telegramApp.initData ||
        JSON.stringify(
          telegramApp.initDataUnsafe || urlParams.get("token") || {}
        );
      setToken(rawInitData);
      localStorage.setItem("telegramInitData", rawInitData);
    } else {
      console.error("Telegram WebApp SDK not found");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user data comes from Telegram - save it
  useEffect(() => {
    if (!user) return;
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    setFullName(name);
    if (user.photo_url) {
      setAvatar(user.photo_url.toString());
    }

    if (user.phone_number) {
      const digits = user.phone_number.replace(/\D/g, "");
      setPhone(new AsYouType().input("+" + digits));
    }

    localStorage.setItem("telegramUser", JSON.stringify(user));
    localStorage.setItem("telegramFullName", name);
    localStorage.setItem("telegramPhone", phone);
    localStorage.setItem("telegramAvatar", avatar);
    localStorage.setItem("telegramToken", token || "");
  }, [user, phone, avatar, token]);

  // Request phone contact
  const requestPhoneContact = () => {
    if (!tg?.requestContact) {
      // Fallback for development/testing without Telegram
      console.warn("requestContact not available");
      return;
    }
    setPhone("");
    setIsLoading(true);
    tg.requestContact((granted: boolean, result: any) => {
      setContactData(result);
      if (granted && result?.responseUnsafe?.contact?.phone_number) {
        const raw = result.responseUnsafe.contact.phone_number;
        setPhone(new AsYouType().input(raw));
      }
      setIsLoading(false);
    });
  };

  // Send contact data and navigate to profile
  useEffect(() => {
    if (!contactData?.response) return;

    (async () => {
      setIsLoading(true);
      try {
        const response = await staffApi.create(
          { contact_init_data: contactData.response, preferences: {} },
          token!
        );

        if (response.status === 200 || response.status === 201) {
          // Successfully created, navigate to main page
          navigate("/staff/main");
        }
      } catch (err: any) {
        // Показываем alert при любой ошибке (нет invitation, доступ запрещён и т.д.)
        setShowInvitationAlert(true);
        console.error("Staff creation error:", err.response?.status, err);
      } finally {
        setIsLoading(false);
        sendData({ fullName, phone, avatar });
      }
    })();
  }, [contactData, token, fullName, phone, avatar, navigate, sendData]);

  if (user === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-600">
        <p className="text-white text-lg animate-pulse">
          {t('onboarding.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${OnboardingBgImg})` }}
        aria-hidden="true"
      />
      <div
        className={`
          relative w-[95%] max-w-md z-10 transition-all duration-800
          ${showCard ? "opacity-95 translate-y-0" : "opacity-0 translate-y-10"}
        `}
      >
        <div className="overflow-hidden w-full">
          <div className="flex transition-transform duration-500 ease-in-out">
            <div className="flex-shrink-0 w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6">
              <div className="flex flex-col items-center">
                {avatar && (
                  <img 
                    src={avatar} 
                    alt="Avatar" 
                    className="w-20 h-20 rounded-full mb-4 border-4 border-white shadow-lg"
                  />
                )}
                <h1 className="text-[28px] font-extrabold text-gray-800 text-center leading-snug">
                  {t('onboarding.welcome')}, {fullName}!
                </h1>
                <p className="mt-1 text-[20px] text-gray-600 text-center">
                  {t('onboarding.requestPhone')}
                </p>
              </div>

              {phone && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500">{t('onboarding.yourPhone')}</p>
                  <p className="text-lg font-semibold text-gray-800">{phone}</p>
                </div>
              )}

              {/* Alert - нет приглашения */}
              {showInvitationAlert && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                  <p className="text-sm font-medium text-center">
                    {t('onboarding.notStaff')}{' '}
                    <a 
                      href="https://t.me/tensuadmin" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {t('onboarding.notStaff.link')}
                    </a>
                  </p>
                </div>
              )}

              {/* Кнопка получения телефона - показывается только если нет телефона и нет ошибки invitation */}
              {!phone && !showInvitationAlert && (
                <button
                  onClick={requestPhoneContact}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-[40px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.loading')}
                    </span>
                  ) : (
                    t('onboarding.getPhoneButton')
                  )}
                </button>
              )}

              {/* Индикатор загрузки после получения телефона (пока проверяется invitation) */}
              {phone && isLoading && !showInvitationAlert && (
                <div className="w-full bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-[40px] text-center">
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.loading')}
                  </span>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                {t('onboarding.privacyNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
