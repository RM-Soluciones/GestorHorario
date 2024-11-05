// app/empleados/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function GestionEmpleados() {
  const [empleados, setEmpleados] = useState([]);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    const { data } = await supabase
      .from('empleados')
      .select('*')
      .order('apellido', { ascending: true });
    setEmpleados(data || []);
  };

  const agregarEmpleado = async (e) => {
    e.preventDefault();

    if (!nombre || !apellido) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const { error } = await supabase.from('empleados').insert([
      {
        nombre,
        apellido,
      },
    ]);

    if (error) {
      console.error('Error al agregar empleado:', error);
      alert('Error al agregar empleado.');
    } else {
      setNombre('');
      setApellido('');
      fetchEmpleados();
    }
  };

  const eliminarEmpleado = async (id) => {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este empleado?');

    if (confirmacion) {
      const { error } = await supabase.from('empleados').delete().eq('id', id);

      if (error) {
        console.error('Error al eliminar empleado:', error);
        alert('Error al eliminar empleado.');
      } else {
        fetchEmpleados();
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Gestión de Empleados</h2>

      {/* Formulario para agregar empleado */}
      <form onSubmit={agregarEmpleado} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Agregar Empleado
        </button>
      </form>

      {/* Lista de empleados */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Nombre</th>
              <th className="table-cell">Apellido</th>
              <th className="table-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((empleado) => (
              <tr key={empleado.id} className="table-row">
                <td className="table-cell">{empleado.nombre}</td>
                <td className="table-cell">{empleado.apellido}</td>
                <td className="table-cell">
                  <button
                    onClick={() => eliminarEmpleado(empleado.id)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
