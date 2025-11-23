import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// ✅ Clé API Google Places configurée
// Places API, Maps JavaScript API activées
const GOOGLE_PLACES_API_KEY = 'AIzaSyAfK0Uz779sCthuHIkhC30FY6Kq9OPuIFY';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelected?: (place: {
    address: string;
    city: string;
    postalCode: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Entrez une adresse...",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger le script Google Maps si pas déjà chargé
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=fr`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setError('Erreur chargement Google Maps');
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    try {
      // Initialiser l'autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'fr' }, // Limiter à la France
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address'] // Seulement les adresses complètes
      });

      // Écouter la sélection d'une adresse
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();

        if (!place || !place.address_components || !place.geometry) {
          return;
        }

        const fullAddress = place.formatted_address || '';
        onChange(fullAddress);

        // Extraire les composants de l'adresse
        let city = '';
        let postalCode = '';

        for (const component of place.address_components) {
          const types = component.types;

          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        }

        const lat = place.geometry.location?.lat() || 0;
        const lng = place.geometry.location?.lng() || 0;

        // Notifier le parent avec toutes les infos
        if (onPlaceSelected) {
          onPlaceSelected({
            address: fullAddress,
            city,
            postalCode,
            lat,
            lng
          });
        }
      });
    } catch (err: any) {
      console.error('Autocomplete error:', err);
      setError(err.message);
    }

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange, onPlaceSelected]);

  // Fallback si API non configurée
  if (GOOGLE_PLACES_API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
          ⚠️ Autocomplete désactivée - Configurez la clé API Google Places
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
      />
    </div>
  );
};

export default AddressAutocomplete;
