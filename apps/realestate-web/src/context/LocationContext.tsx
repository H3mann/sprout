import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'realm_search_location';
export const DEFAULT_LOCATION = 'United States';

export const LOCATION_OPTIONS = [
  'United States',
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
  'District of Columbia',
];

interface LocationContextValue {
  location: string;
  setLocation: (loc: string) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCATION;
    } catch {
      return DEFAULT_LOCATION;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, location);
    } catch {}
  }, [location]);

  const setLocation = (loc: string) => {
    setLocationState(loc?.trim() || DEFAULT_LOCATION);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useSearchLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useSearchLocation must be used within LocationProvider');
  return ctx;
}
