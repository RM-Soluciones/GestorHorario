// app/reportes/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reportes() {
  const [empleados, setEmpleados] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [totales, setTotales] = useState({});

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

  const fetchReportes = async () => {
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

    if (fechaInicio) {
      query = query.gte('fecha', fechaInicio);
    }

    if (fechaFin) {
      query = query.lte('fecha', fechaFin);
    }

    const { data, error } = await query.order('fecha', { ascending: true });

    if (error) {
      console.error('Error al obtener reportes:', error);
    } else {
      setReportes(data);
      calcularTotales(data);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, [empleadoSeleccionado, fechaInicio, fechaFin]);

  const calcularTotales = (reportes) => {
    const totalesTemp = {};

    const diasUnicos = {};

    reportes.forEach((registro) => {
      const fecha = registro.fecha;
      const tipoDia = registro.tipo_dia;
      const trabajoEnFeriado = registro.trabajo_en_feriado;

      // Si no existe la fecha, inicializar
      if (!diasUnicos[fecha]) {
        diasUnicos[fecha] = {
          tipoDia: tipoDia,
          trabajoEnFeriado: trabajoEnFeriado,
          horasTrabajadas: 0,
        };
      } else {
        // Definir prioridad de tipo de día
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

        // Si es trabajo en feriado, marcarlo
        if (tipoDia === 'Feriado' && trabajoEnFeriado) {
          diasUnicos[fecha].trabajoEnFeriado = true;
        }
      }

      // Acumular horas trabajadas
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

        if (!diasUnicos[fecha].horasTrabajadas) {
          diasUnicos[fecha].horasTrabajadas = horasTrabajadas;
        } else {
          diasUnicos[fecha].horasTrabajadas += horasTrabajadas;
        }
      }
    });

    // Inicializar total de horas trabajadas
    totalesTemp['Horas Trabajadas'] = 0;

    // Contar días por tipo
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

      // Sumar horas trabajadas
      if (registroDia.horasTrabajadas) {
        totalesTemp['Horas Trabajadas'] += registroDia.horasTrabajadas;
      }
    }

    setTotales(totalesTemp);
  };

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.text('Reporte de Horas', 14, 20);

    autoTable(doc, {
      head: [['Empleado', 'Fecha', 'Entrada', 'Salida', 'Tipo de Día']],
      body: reportes.map((registro) => [
        registro.empleados.nombre + ' ' + registro.empleados.apellido,
        registro.fecha,
        registro.hora_entrada || '-',
        registro.hora_salida || '-',
        registro.tipo_dia +
          (registro.trabajo_en_feriado ? ' (Trabajó en Feriado)' : ''),
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

    // Obtener el nombre del empleado
    let nombreEmpleado = 'Todos_los_Empleados';

    if (empleadoSeleccionado) {
      const empleado = empleados.find((emp) => emp.id === empleadoSeleccionado);
      if (empleado) {
        nombreEmpleado = `${empleado.nombre}_${empleado.apellido}`;
      }
    }

    // Obtener el mes y año del reporte
    let nombreMes = '';
    if (fechaInicio) {
      const dateInicio = new Date(fechaInicio);
      const options = { month: 'long', year: 'numeric' };
      nombreMes = dateInicio.toLocaleDateString('es-ES', options);
    }

    // Crear el nombre del archivo
    let nombreArchivo = `Reporte_${nombreEmpleado}`;
    if (nombreMes) {
      nombreArchivo += `_${nombreMes}`;
    }

    nombreArchivo += '.pdf';

    // Guardar el PDF con el nombre especificado
    doc.save(nombreArchivo);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Reportes</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block">Selecciona un Empleado</label>
          <select
            value={empleadoSeleccionado || ''}
            onChange={(e) => setEmpleadoSeleccionado(e.target.value || null)}
            className="mt-1 block w-full border-gray-300 rounded-md"
          >
            <option value="">Todos los Empleados</option>
            {empleados.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} {empleado.apellido}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchReportes}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Filtrar
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">Totales</h3>
        <ul>
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

      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Empleado</th>
              <th className="table-cell">Fecha</th>
              <th className="table-cell">Entrada</th>
              <th className="table-cell">Salida</th>
              <th className="table-cell">Tipo de Día</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((registro) => (
              <tr
                key={registro.id}
                className={`table-row ${
                  registro.tipo_dia === 'Feriado' &&
                  registro.trabajo_en_feriado
                    ? 'bg-yellow-100'
                    : ''
                }`}
              >
                <td className="table-cell">
                  {registro.empleados.nombre} {registro.empleados.apellido}
                </td>
                <td className="table-cell">{registro.fecha}</td>
                <td className="table-cell">
                  {registro.hora_entrada || '-'}
                </td>
                <td className="table-cell">
                  {registro.hora_salida || '-'}
                </td>
                <td className="table-cell">
                  {registro.tipo_dia}
                  {registro.trabajo_en_feriado
                    ? ' (Trabajó en Feriado)'
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={generarPDF} className="btn-secondary mt-4">
        Descargar Reporte en PDF
      </button>
    </div>
  );
}
