import "./globals.css";

export const metadata = {
  title: "Personal Chat App",
  description: "Web client",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
