import { useState, useEffect } from 'react';

const REGION_STORAGE_KEY = 'dobinge_active_region';

export function useRegion() {
  const [countryCode, setCountryCodeState] = useState<string>('US'); 
  const [isRegionResolved, setIsRegionResolved] = useState(false);

  useEffect(() => {
    const initializeRegion = async () => {
      const savedRegion = localStorage.getItem(REGION_STORAGE_KEY);
      
      if (savedRegion) {
        setCountryCodeState(savedRegion.toUpperCase());
        setIsRegionResolved(true);
        return;
      }

      // Zero-cost IP geolocation fallback for first-time users
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const detectedCode = data.country_code || 'US';
        
        setCountryCodeState(detectedCode);
        localStorage.setItem(REGION_STORAGE_KEY, detectedCode);
      } catch (error) {
        setCountryCodeState('US'); // Failsafe
      } finally {
        setIsRegionResolved(true);
      }
    };

    initializeRegion();
  }, []);

  const setCountryCode = (code: string) => {
    const formattedCode = code.toUpperCase().slice(0, 2);
    setCountryCodeState(formattedCode);
    localStorage.setItem(REGION_STORAGE_KEY, formattedCode);
  };

  return { countryCode, setCountryCode, isRegionResolved };
}