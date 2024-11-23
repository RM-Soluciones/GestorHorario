// app/reportes/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../utils/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reportes() {
  const [empleados, setEmpleados] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  // Inicializar selectedMonthYear al mes y año actuales en formato 'YYYY-MM'
  const today = new Date();
  const [selectedMonthYear, setSelectedMonthYear] = useState(
    today.toISOString().substr(0, 7)
  );

  // Estados para las fechas de inicio y fin
  const [fechaInicio, setFechaInicio] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]
  );

  // Estados para selección de reportes y edición
  const [reportesSeleccionados, setReportesSeleccionados] = useState([]);
  const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
  const [reporteAEditar, setReporteAEditar] = useState(null);
  const [formValues, setFormValues] = useState({
    fecha: '',
    hora_entrada: '',
    hora_salida: '',
    tipo_dia: '',
    trabajo_en_feriado: false,
  });

  // Fetch empleados al montar el componente
  useEffect(() => {
    const fetchEmpleados = async () => {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre, apellido');

      if (error) {
        console.error('Error al obtener empleados:', error);
      } else {
        setEmpleados(data);
      }
    };

    fetchEmpleados();
  }, []);

  // Actualizar fechas al cambiar el mes seleccionado
  useEffect(() => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 0);
    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);
  }, [selectedMonthYear]);

  // Función para filtrar reportes
  const filtrarReportes = async () => {
    let query = supabase.from('registros_horas').select(`
      id,
      empleado_id,
      fecha,
      hora_entrada,
      hora_salida,
      tipo_dia,
      trabajo_en_feriado,
      empleados (
        nombre,
        apellido
      )
    `);

    if (empleadoSeleccionado) {
      query = query.eq('empleado_id', empleadoSeleccionado);
    }

    query = query
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin);

    const { data, error } = await query.order('fecha', { ascending: true });

    if (error) {
      console.error('Error al obtener reportes:', error);
      alert('Error al obtener reportes.');
    } else {
      setReportes(data);
      setReportesSeleccionados([]); // Limpiar selección al filtrar
    }
  };

  // Inicializar los reportes al cargar el componente
  useEffect(() => {
    filtrarReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calcular totales cada vez que 'reportes' cambie
  const totales = useMemo(() => {
    const totalesTemp = {};
    const diasUnicos = {};

    reportes.forEach((registro) => {
      const fecha = registro.fecha;
      const tipoDia = registro.tipo_dia;
      const trabajoEnFeriado = registro.trabajo_en_feriado;

      if (!diasUnicos[fecha]) {
        diasUnicos[fecha] = {
          tipoDia: tipoDia,
          trabajoEnFeriado: trabajoEnFeriado,
          horasTrabajadas: 0,
        };
      } else {
        const prioridad = {
          'Falta Injustificada': 1,
          'Falta Justificada': 2,
          'Suspensión': 3,
          'Vacaciones': 4,
          'Feriado': 5,
          'Descanso': 6,
          'Trabajo': 7,
        };

        const tipoActual = diasUnicos[fecha].tipoDia;

        if (prioridad[tipoDia] < prioridad[tipoActual]) {
          diasUnicos[fecha].tipoDia = tipoDia;
        }

        if (tipoDia === 'Feriado' && trabajoEnFeriado) {
          diasUnicos[fecha].trabajoEnFeriado = true;
        }
      }

      if (
        (tipoDia === 'Trabajo' || (tipoDia === 'Feriado' && trabajoEnFeriado)) &&
        registro.hora_entrada &&
        registro.hora_salida
      ) {
        const entrada = new Date(`1970-01-01T${registro.hora_entrada}Z`);
        const salida = new Date(`1970-01-01T${registro.hora_salida}Z`);
        let horasTrabajadas = (salida - entrada) / (1000 * 60 * 60);

        if (horasTrabajadas < 0) {
          horasTrabajadas += 24;
        }

        diasUnicos[fecha].horasTrabajadas += horasTrabajadas;
      }
    });

    totalesTemp['Horas Trabajadas'] = 0;

    for (const fecha in diasUnicos) {
      const registroDia = diasUnicos[fecha];
      let tipoDia = registroDia.tipoDia;

      if (tipoDia === 'Feriado' && registroDia.trabajoEnFeriado) {
        tipoDia = 'Feriado Trabajado';
      } else if (tipoDia === 'Feriado') {
        tipoDia = 'Feriado No Trabajado';
      }

      if (!totalesTemp[tipoDia]) {
        totalesTemp[tipoDia] = 1;
      } else {
        totalesTemp[tipoDia] += 1;
      }

      if (registroDia.horasTrabajadas) {
        totalesTemp['Horas Trabajadas'] += registroDia.horasTrabajadas;
      }
    }

    return totalesTemp;
  }, [reportes]);

  // Función para eliminar un registro
  const eliminarRegistro = async (id) => {
    const confirmacion = confirm('¿Estás seguro de que deseas eliminar este registro?');

    if (confirmacion) {
      const { error } = await supabase.from('registros_horas').delete().eq('id', id);

      if (error) {
        console.error('Error al eliminar registro:', error);
        alert('Error al eliminar el registro.');
      } else {
        // Actualizar la lista de reportes
        setReportes(reportes.filter((registro) => registro.id !== id));
        alert('Registro eliminado exitosamente.');
      }
    }
  };

  // Función para eliminar reportes seleccionados
  const eliminarReportesSeleccionados = async () => {
    if (reportesSeleccionados.length === 0) {
      alert('No has seleccionado ningún registro para eliminar.');
      return;
    }

    const confirmacion = confirm('¿Estás seguro de que deseas eliminar los registros seleccionados?');

    if (confirmacion) {
      const { error } = await supabase
        .from('registros_horas')
        .delete()
        .in('id', reportesSeleccionados);

      if (error) {
        console.error('Error al eliminar registros:', error);
        alert('Error al eliminar los registros seleccionados.');
      } else {
        // Actualizar la lista de reportes
        setReportes(reportes.filter((registro) => !reportesSeleccionados.includes(registro.id)));
        setReportesSeleccionados([]);
        alert('Registros eliminados exitosamente.');
      }
    }
  };

  // Función para abrir el modal de edición
  const abrirModalEditar = (registro) => {
    setReporteAEditar(registro);
    setFormValues({
      fecha: registro.fecha,
      hora_entrada: registro.hora_entrada || '',
      hora_salida: registro.hora_salida || '',
      tipo_dia: registro.tipo_dia,
      trabajo_en_feriado: registro.trabajo_en_feriado,
    });
    setIsEditarModalOpen(true);
  };

  // Función para cerrar el modal de edición
  const cerrarModalEditar = () => {
    setIsEditarModalOpen(false);
    setReporteAEditar(null);
  };

  // Función para manejar cambios en el formulario de edición
  const manejarCambioFormulario = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Función para guardar los cambios de edición
  const guardarCambios = async () => {
    const { fecha, hora_entrada, hora_salida, tipo_dia, trabajo_en_feriado } = formValues;

    // Validaciones básicas
    if (!fecha || !tipo_dia) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    const { error } = await supabase
      .from('registros_horas')
      .update({
        fecha,
        hora_entrada: hora_entrada || null,
        hora_salida: hora_salida || null,
        tipo_dia,
        trabajo_en_feriado,
      })
      .eq('id', reporteAEditar.id);

    if (error) {
      console.error('Error al actualizar registro:', error);
      alert('Error al actualizar el registro.');
    } else {
      // Actualizar la lista de reportes
      setReportes(
        reportes.map((registro) =>
          registro.id === reporteAEditar.id
            ? { ...registro, fecha, hora_entrada, hora_salida, tipo_dia, trabajo_en_feriado }
            : registro
        )
      );
      alert('Registro actualizado exitosamente.');
      cerrarModalEditar();
    }
  };

  // Generar reporte PDF
  const generarPDF = () => {
    const doc = new jsPDF();

    doc.text('Reporte de Horas', 14, 20);

    autoTable(doc, {
      head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Tipo de Día']],
      body: reportes.map((registro) => [
        `${registro.empleados.nombre} ${registro.empleados.apellido}`,
        registro.fecha,
        registro.hora_entrada || '-',
        registro.hora_salida || '-',
        `${registro.tipo_dia}${
          registro.trabajo_en_feriado ? ' (Trabajó en Feriado)' : ''
        }`,
      ]),
      startY: 30,
    });

    const totalesArray = Object.entries(totales).map(([key, value]) => {
      if (key === 'Horas Trabajadas') {
        const totalHours = Math.floor(value);
        const totalMinutes = Math.round((value - totalHours) * 60);
        return `${key}: ${totalHours}h ${totalMinutes}m`;
      } else {
        return `${key}: ${value}`;
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.text('Totales:', 14, finalY);

    totalesArray.forEach((linea, index) => {
      doc.text(linea, 20, finalY + 6 + index * 6);
    });

    let nombreEmpleado = 'Todos_los_Empleados';

    if (empleadoSeleccionado) {
      const empleado = empleados.find(
        (emp) => emp.id === empleadoSeleccionado
      );
      if (empleado) {
        nombreEmpleado = `${empleado.nombre}_${empleado.apellido}`;
      }
    }

    const options = { month: 'long', year: 'numeric' };
    const date = new Date(`${selectedMonthYear}-01`);
    const nombreMes = date.toLocaleDateString('es-ES', options);

    const nombreArchivo = `Reporte_${nombreEmpleado}_${nombreMes}.pdf`;

    doc.save(nombreArchivo);
  };

  // Manejar selección de un reporte
  const manejarSeleccion = (id) => {
    if (reportesSeleccionados.includes(id)) {
      setReportesSeleccionados(reportesSeleccionados.filter((selectedId) => selectedId !== id));
    } else {
      setReportesSeleccionados([...reportesSeleccionados, id]);
    }
  };

  // Manejar selección de todos los reportes
  const manejarSeleccionTodos = () => {
    if (reportesSeleccionados.length === reportes.length) {
      setReportesSeleccionados([]);
    } else {
      const todosIds = reportes.map((registro) => registro.id);
      setReportesSeleccionados(todosIds);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Reportes</h2>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Empleado */}
        <div>
          <label className="block text-gray-700">Selecciona un Empleado</label>
          <select
            value={empleadoSeleccionado || ''}
            onChange={(e) =>
              setEmpleadoSeleccionado(
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Todos los Empleados</option>
            {empleados.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Mes */}
        <div>
          <label className="block text-gray-700">Mes</label>
          <input
            type="month"
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Fecha de Inicio */}
        <div>
          <label className="block text-gray-700">Fecha de Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
          />
        </div>

        {/* Fecha de Fin */}
        <div>
          <label className="block text-gray-700">Fecha de Fin</label>
          <input
            type="date"
            value={fechaFin}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        {/* Botón Filtrar */}
        <button
          onClick={filtrarReportes}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Filtrar
        </button>

        {/* Botón Eliminar Seleccionados */}
        <button
          onClick={eliminarReportesSeleccionados}
          className={`${
            reportesSeleccionados.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600'
          } text-white px-4 py-2 rounded-md`}
          disabled={reportesSeleccionados.length === 0}
        >
          Eliminar Seleccionados
        </button>
      </div>

      {/* Totales */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Totales</h3>
        <ul className="list-disc list-inside">
          {Object.entries(totales).map(([key, value]) => {
            if (key === 'Horas Trabajadas') {
              const totalHours = Math.floor(value);
              const totalMinutes = Math.round((value - totalHours) * 60);
              return (
                <li key={key}>
                  {key}: {totalHours}h {totalMinutes}m
                </li>
              );
            } else {
              return (
                <li key={key}>
                  {key}: {value}
                </li>
              );
            }
          })}
        </ul>
      </div>

      {/* Tabla de Reportes */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">
                <input
                  type="checkbox"
                  checked={reportesSeleccionados.length === reportes.length && reportes.length > 0}
                  onChange={manejarSeleccionTodos}
                />
              </th>
              <th className="px-4 py-2 border">Empleado</th>
              <th className="px-4 py-2 border">Fecha</th>
              <th className="px-4 py-2 border">Entrada</th>
              <th className="px-4 py-2 border">Salida</th>
              <th className="px-4 py-2 border">Tipo de Día</th>
              <th className="px-4 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((registro) => (
              <tr
                key={registro.id}
                className={`${
                  registro.tipo_dia === 'Feriado' && registro.trabajo_en_feriado
                    ? 'bg-yellow-100'
                    : ''
                }`}
              >
                <td className="px-4 py-2 border text-center">
                  <input
                    type="checkbox"
                    checked={reportesSeleccionados.includes(registro.id)}
                    onChange={() => manejarSeleccion(registro.id)}
                  />
                </td>
                <td className="px-4 py-2 border">
                  {registro.empleados.nombre} {registro.empleados.apellido}
                </td>
                <td className="px-4 py-2 border">{registro.fecha}</td>
                <td className="px-4 py-2 border">
                  {registro.hora_entrada || '-'}
                </td>
                <td className="px-4 py-2 border">
                  {registro.hora_salida || '-'}
                </td>
                <td className="px-4 py-2 border">
                  {registro.tipo_dia}
                  {registro.trabajo_en_feriado
                    ? ' (Trabajó en Feriado)'
                    : ''}
                </td>
                <td className="px-4 py-2 border flex space-x-2">
                  {/* Botón Editar */}
                  <button
                    onClick={() => abrirModalEditar(registro)}
                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                  >
                    Editar
                  </button>
                  {/* Botón Eliminar */}
                  <button
                    onClick={() => eliminarRegistro(registro.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {/* Mostrar mensaje si no hay reportes */}
            {reportes.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-2 border text-center">
                  No hay reportes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Botón Descargar PDF */}
      <button
        onClick={generarPDF}
        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 mt-6"
      >
        Descargar Reporte en PDF
      </button>

      {/* Modal de Edición */}
      {isEditarModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6">
            <h3 className="text-xl font-semibold mb-4">Editar Reporte</h3>
            <form>
              <div className="mb-4">
                <label className="block text-gray-700">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formValues.fecha}
                  onChange={manejarCambioFormulario}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Hora de Entrada</label>
                <input
                  type="time"
                  name="hora_entrada"
                  value={formValues.hora_entrada}
                  onChange={manejarCambioFormulario}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Hora de Salida</label>
                <input
                  type="time"
                  name="hora_salida"
                  value={formValues.hora_salida}
                  onChange={manejarCambioFormulario}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Tipo de Día</label>
                <select
                  name="tipo_dia"
                  value={formValues.tipo_dia}
                  onChange={manejarCambioFormulario}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Selecciona un Tipo de Día</option>
                  <option value="Falta Injustificada">Falta Injustificada</option>
                  <option value="Falta Justificada">Falta Justificada</option>
                  <option value="Suspensión">Suspensión</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Feriado">Feriado</option>
                  <option value="Descanso">Descanso</option>
                  <option value="Trabajo">Trabajo</option>
                </select>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="trabajo_en_feriado"
                  checked={formValues.trabajo_en_feriado}
                  onChange={manejarCambioFormulario}
                  className="mr-2"
                />
                <label className="text-gray-700">Trabajó en Feriado</label>
              </div>
            </form>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cerrarModalEditar}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={guardarCambios}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
