// app/components/NavBar.js
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="bg-primary text-white">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 text-lg font-semibold">
            Control de Horas
          </div>
          <div className="flex space-x-4">
            <Link href="/registro" className="hover:text-accent">
              Registrar Horas
            </Link>
            <Link href="/reportes" className="hover:text-accent">
              Reportes
            </Link>
            <Link href="/empleados" className="hover:text-accent">
              Empleados
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
