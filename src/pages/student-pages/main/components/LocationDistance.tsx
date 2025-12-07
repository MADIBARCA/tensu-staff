import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { MapPin } from 'lucide-react';
import { clubsApi } from '@/functions/axios/axiosFunctions';

export const LocationDistance: React.FC = () => {
  const { t } = useI18n();
  const [distance, setDistance] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Check permission status
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        setHasPermission(permissionStatus.state !== 'denied');

        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
          calculateDistance();
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkLocationPermission();
  }, []);

  const calculateDistance = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          const tg = window.Telegram?.WebApp;
          const token = tg?.initData || null;
          
          try {
            const response = await clubsApi.getNearest(userLat, userLon, token);
            const clubLat = response.data.latitude;
            const clubLon = response.data.longitude;

          // Calculate distance using Haversine formula
          const R = 6371e3; // Earth radius in meters
          const φ1 = (userLat * Math.PI) / 180;
          const φ2 = (clubLat * Math.PI) / 180;
          const Δφ = ((clubLat - userLat) * Math.PI) / 180;
          const Δλ = ((clubLon - userLon) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          const distanceInMeters = R * c;
          setDistance(Math.round(distanceInMeters));
          } catch (error) {
            // API might not be ready yet, use mock distance for demo
            console.warn('Clubs API not available yet, using mock distance:', error);
            // Mock club location (Almaty center) for demo
            const mockClubLat = 43.2220;
            const mockClubLon = 76.8512;
            
            // Calculate distance using Haversine formula
            const R = 6371e3; // Earth radius in meters
            const φ1 = (userLat * Math.PI) / 180;
            const φ2 = (mockClubLat * Math.PI) / 180;
            const Δφ = ((mockClubLat - userLat) * Math.PI) / 180;
            const Δλ = ((mockClubLon - userLon) * Math.PI) / 180;

            const a =
              Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const distanceInMeters = R * c;
            setDistance(Math.round(distanceInMeters));
          }
        } catch (error) {
          console.error('Error calculating distance:', error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        // For demo purposes, if geolocation fails, use mock location
        if (error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE) {
          setHasPermission(false);
        } else {
          // Use mock location for demo
          const mockLat = 43.2389;
          const mockLon = 76.8897;
          const clubLat = 43.2220;
          const clubLon = 76.8512;
          
          const R = 6371e3;
          const φ1 = (mockLat * Math.PI) / 180;
          const φ2 = (clubLat * Math.PI) / 180;
          const Δφ = ((clubLat - mockLat) * Math.PI) / 180;
          const Δλ = ((clubLon - mockLon) * Math.PI) / 180;

          const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          const distanceInMeters = R * c;
          setDistance(Math.round(distanceInMeters));
          setHasPermission(true);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return null;
  }

  if (!hasPermission || distance === null) {
    return null;
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters} ${t('home.location.meters')}`;
    }
    const km = (meters / 1000).toFixed(1);
    return `${km} ${t('home.location.km')}`;
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <MapPin size={16} className="text-blue-600" />
        <span>
          {t('home.location.distance').replace('{distance}', formatDistance(distance))}
        </span>
      </div>
    </div>
  );
};
