// app/layout.js
// Root layout — wraps every page with global styles and metadata.

import './globals.css';

export const metadata = {
  title: 'The Collective',
  description: 'An AI-assisted notetaking app for students',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
