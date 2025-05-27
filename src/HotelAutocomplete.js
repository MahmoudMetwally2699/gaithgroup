import React, { useState, useEffect, useRef } from 'react';
import './HotelAutocomplete.css';

const HotelAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length >= 2) {
      // Debounce API calls
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchHotels(query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchHotels = async (searchQuery) => {
    setIsLoading(true);
    try {
      // Using Photon API with geographical boundaries for Saudi Arabia and Egypt
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=50&bbox=24.0,12.0,55.0,32.0&osm_tag=tourism:hotel&osm_tag=amenity:hotel`;

      console.log('Searching Photon for hotels in Saudi/Egypt:', searchQuery);

      const response = await fetch(url);
      const data = await response.json();

      console.log('Photon API Response:', data);

      if (!data || !data.features || !Array.isArray(data.features)) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
        return;
      }

      const filteredHotels = data.features
        .filter(feature => {
          const props = feature.properties || {};
          const name = (props.name || '').toLowerCase();
          const osm_key = props.osm_key;
          const osm_value = props.osm_value;
          const country = (props.country || '').toLowerCase();
          const countrycode = (props.countrycode || '').toLowerCase();

          // Improved country detection for Saudi Arabia and Egypt
          const isTargetCountry = country.includes('saudi') ||
                                 country.includes('egypt') ||
                                 country.includes('مصر') ||
                                 country.includes('السعودية') ||
                                 countrycode === 'sa' ||
                                 countrycode === 'eg';

          const isHotel = (osm_key === 'tourism' && osm_value === 'hotel') ||
                         (osm_key === 'amenity' && osm_value === 'hotel') ||
                         name.includes('hotel') ||
                         name.includes('resort') ||
                         name.includes('inn') ||
                         name.includes('suites') ||
                         name.includes('hilton') ||
                         name.includes('marriott') ||
                         name.includes('hyatt');

          console.log('Filtering:', {
            name: props.name,
            country: country,
            countrycode: countrycode,
            isTargetCountry: isTargetCountry,
            isHotel: isHotel
          });

          return isTargetCountry && isHotel;
        })
        .map(feature => {
          const props = feature.properties;
          const hotelName = props.name || 'Unknown Hotel';
          const city = props.city || props.state || '';
          const country = props.country || '';

          const location = [city, country].filter(Boolean).join(', ');

          return {
            value: hotelName,
            full: hotelName + (location ? ', ' + location : ''),
            sortKey: hotelName.toLowerCase()
          };
        })
        .filter((hotel, index, self) =>
          self.findIndex(h => h.value === hotel.value) === index
        )
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .slice(0, 15);

      setSuggestions(filteredHotels);
      setShowSuggestions(filteredHotels.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prevIndex =>
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prevIndex =>
          prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  useEffect(() => {
    // Scroll selected suggestion into view
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className="hotel-autocomplete">
      <div className="form-container">
        <form onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="hotel">Search for a hotel:</label>
          <div className="autocomplete-wrapper">
            <input
              id="hotel"
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter hotel name"
              autoComplete="off"
              className={isLoading ? 'loading' : ''}
            />
            {showSuggestions && (
              <div className="tt-menu">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      ref={el => suggestionRefs.current[index] = el}
                      className={`tt-suggestion ${selectedIndex === index ? 'tt-cursor' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {suggestion.full}
                    </div>
                  ))
                ) : (
                  <div className="tt-empty">
                    {isLoading ? 'Searching...' : 'No hotels found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelAutocomplete;
