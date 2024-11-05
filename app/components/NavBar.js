// app/components/NavBar.js
import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="">
      <ul className="flex flex-col md:flex-row md:space-x-4">
        <li>
          <Link href="/">Inicio</Link>
        </li>
        <li>
          <Link href="/registro">Registrar Horas</Link>
        </li>
        <li>
          <Link href="/reportes">Reportes</Link>
        </li>
        <li>
          <Link href="/empleados">Empleados</Link>
        </li>
      </ul>
    </nav>
  );
}
