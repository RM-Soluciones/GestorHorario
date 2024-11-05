// app/registro/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import Select from 'react-select';

export default function RegistroHoras() {
  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha: new Date().toISOString().substr(0, 10),
    timeIntervals: [
      { horaEntrada: '', horaSalida: '' },
    ],
    tipoDia: 'Trabajo',
    trabajoEnFeriado: false,
  });

  const [empleados, setEmpleados] = useState([]);

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

  const opcionesEmpleados = empleados.map((empleado) => ({
    value: empleado.id,
    label: `${empleado.nombre} ${empleado.apellido}`,
  }));

  const tiposDia = [
    'Trabajo',
    'Descanso',
    'Feriado',
    'Vacaciones',
    'Falta Injustificada',
    'Falta Justificada',
    'Suspensión',
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleEmpleadoChange = (selectedOption) => {
    setFormData({ ...formData, empleadoId: selectedOption ? selectedOption.value : '' });
  };

  const handleTimeIntervalChange = (index, e) => {
    const { name, value } = e.target;
    const newTimeIntervals = [...formData.timeIntervals];
    newTimeIntervals[index][name] = value;
    setFormData({ ...formData, timeIntervals: newTimeIntervals });
  };

  const addTimeInterval = () => {
    setFormData({
      ...formData,
      timeIntervals: [...formData.timeIntervals, { horaEntrada: '', horaSalida: '' }],
    });
  };

  const removeTimeInterval = (index) => {
    const newTimeIntervals = [...formData.timeIntervals];
    newTimeIntervals.splice(index, 1);
    setFormData({ ...formData, timeIntervals: newTimeIntervals });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { empleadoId, fecha, timeIntervals, tipoDia, trabajoEnFeriado } = formData;

    if (!empleadoId || !fecha || !tipoDia) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if ((tipoDia === 'Trabajo' || (tipoDia === 'Feriado' && trabajoEnFeriado)) && timeIntervals.length === 0) {
      alert('Debes agregar al menos un intervalo de horas.');
      return;
    }

    const registros = timeIntervals.map((intervalo) => ({
      empleado_id: empleadoId,
      fecha,
      hora_entrada: intervalo.horaEntrada || null,
      hora_salida: intervalo.horaSalida || null,
      tipo_dia: tipoDia,
      trabajo_en_feriado: trabajoEnFeriado,
    }));

    const { data, error } = await supabase.from('registros_horas').insert(registros);

    if (error) {
      console.error('Error al insertar registro:', error);
    } else {
      console.log('Registro insertado:', data);
      setFormData({
        empleadoId: '',
        fecha: new Date().toISOString().substr(0, 10),
        timeIntervals: [
          { horaEntrada: '', horaSalida: '' },
        ],
        tipoDia: 'Trabajo',
        trabajoEnFeriado: false,
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Registrar Horas</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Empleado */}
        <div>
          <label className="block">Empleado</label>
          <Select
            name="empleadoId"
            options={opcionesEmpleados}
            onChange={handleEmpleadoChange}
            value={opcionesEmpleados.find(option => option.value === formData.empleadoId) || null}
            className="mt-1"
            placeholder="Selecciona un empleado"
            isClearable
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md"
            required
          />
        </div>

        {/* Tipo de Día */}
        <div>
          <label className="block">Tipo de Día</label>
          <select
            name="tipoDia"
            value={formData.tipoDia}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md"
            required
          >
            {tiposDia.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        {/* Trabajo en Feriado */}
        {formData.tipoDia === 'Feriado' && (
          <div>
            <label className="inline-flex items-center mt-3">
              <input
                type="checkbox"
                name="trabajoEnFeriado"
                checked={formData.trabajoEnFeriado}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Trabajó en Feriado</span>
            </label>
          </div>
        )}

        {/* Horas */}
        {(formData.tipoDia === 'Trabajo' || (formData.tipoDia === 'Feriado' && formData.trabajoEnFeriado)) && formData.timeIntervals.map((intervalo, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block">Hora de Entrada</label>
              <input
                type="time"
                name="horaEntrada"
                value={intervalo.horaEntrada}
                onChange={(e) => handleTimeIntervalChange(index, e)}
                className="mt-1 block w-full border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block">Hora de Salida</label>
              <input
                type="time"
                name="horaSalida"
                value={intervalo.horaSalida}
                onChange={(e) => handleTimeIntervalChange(index, e)}
                className="mt-1 block w-full border-gray-300 rounded-md"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => removeTimeInterval(index)}
                className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {(formData.tipoDia === 'Trabajo' || (formData.tipoDia === 'Feriado' && formData.trabajoEnFeriado)) && (
          <div>
            <button
              type="button"
              onClick={addTimeInterval}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Agregar Horario
            </button>
          </div>
        )}

        {/* Botón */}
        <div>
          <button type="submit" className="btn-primary">
            Guardar Registro
          </button>
        </div>
      </form>
    </div>
  );
}
