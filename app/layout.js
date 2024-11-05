// app/layout.js
import './globals.css';
import NavBar from './components/NavBar';

export const metadata = {
  title: 'Control de Horas',
  description: 'Aplicación para el control de horas del personal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gris-claro">
        <NavBar />
        {children}
      </body>
    </html>
  );
}