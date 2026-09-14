import React, { useState, useEffect } from 'react';

export default function NavBar() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      // format: Mon, 14 Sept 2026 · 19:06:26
      const formatted = now.toLocaleDateString('en-GB', {
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric'
      }) + ' · ' + now.toLocaleTimeString('en-GB', { hour12: false });
      setTimeStr(formatted);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav style={{ justifyContent: 'flex-end' }}>
      <div className="navmeta">{timeStr}</div>
    </nav>
  );
}
