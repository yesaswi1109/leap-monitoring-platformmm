import React from 'react';
import './globals.css';

export const metadata = {
  title: 'LEAP Monitoring Dashboard',
  description: 'Real-time API monitoring and incident tracking platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
