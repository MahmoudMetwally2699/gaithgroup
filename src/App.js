import React from 'react';
import './App.css';
import HotelAutocomplete from './HotelAutocomplete';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hotel Search</h1>
        <p>Find hotels in Saudi Arabia and Egypt</p>
      </header>
      <main>
        <HotelAutocomplete />
      </main>
    </div>
  );
}

export default App;
