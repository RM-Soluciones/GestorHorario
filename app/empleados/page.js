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
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('apellido', { ascending: true });

    if (error) {
      console.error('Error al obtener empleados:', error);
    } else {
      setEmpleados(data);
    }
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
    } else {
      setNombre('');
      setApellido('');
      fetchEmpleados();
    }
  };

  const eliminarEmpleado = async (id) => {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este empleado?');

    if (confirmacion) {
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar empleado:', error);
      } else {
        fetchEmpleados();
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Gestión de Empleados</h2>

      {/* Formulario para agregar empleado */}
      <form onSubmit={agregarEmpleado} className="mb-4">
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="flex-1 mb-2 md:mb-0">
            <label className="block">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-2">
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
                    className="px-2 py-1 bg-rojo text-white rounded-md hover:bg-rojo-oscuro"
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
