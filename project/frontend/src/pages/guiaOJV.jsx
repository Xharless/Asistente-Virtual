import React, { useState } from "react";
import "./guiaOJV.css";
import {
  cargarRevisarCausa,
  cargarEnviarEscrito,
  descripcionesRevisar,
  descripcionesEscrito
} from "../hooks/cargarImagenes";


export default function GuiaOJV() {
  const [accion, setAccion] = useState("");

  const revisarImgs = cargarRevisarCausa();
  const escritoImgs = cargarEnviarEscrito();

  return (
    <div className="guia-container">
      <h2>Guía de la Oficina Judicial Virtual</h2>
      <p className="intro">
        Seleccione una acción para ver una guía paso a paso.
      </p>

      {/* Barra de selección */}
      <div className="form-group">
        <label>Seleccione acción que necesita realizar:</label>
        <select value={accion} onChange={(e) => setAccion(e.target.value)}>
          <option value="">-- Seleccione una opción --</option>
          <option value="revisar">Revisar causa</option>
          <option value="escrito">Enviar escrito</option>
          <option value="estado">Ver estado de un escrito</option>
          <option value="notificaciones">Revisar notificaciones</option>
          <option value="audiencias">Consultar audiencias</option>
        </select>
      </div>

      {/* REVISAR CAUSA */}
      {accion === "revisar" && (
        <section className="guia-section">
          <h3>Revisar causa</h3>

          {revisarImgs.map((img, index) => (
            <div key={index} className="guia-paso">
              <h4>Paso {index + 1}</h4>
              <p className="descripcion-paso">{descripcionesRevisar[index]}</p>
              <img
                src={img}
                alt={`Paso ${index + 1}`}
                className="guia-imagen"
              />
            </div>
          ))}
        </section>
      )}

      {/* ENVIAR ESCRITO */}
      {accion === "escrito" && (
        <section className="guia-section">
          <h3>Enviar escrito</h3>

          {escritoImgs.map((img, index) => (
            <div key={index} className="guia-paso">
              <h4>Paso {index + 1}</h4>
              <p className="descripcion-paso">{descripcionesEscrito[index]}</p>
              <img
                src={img}
                alt={`Paso ${index + 1}`}
                className="guia-imagen"
              />
            </div>
          ))}
        </section>
      )}

      {accion === "estado" && (
        <section className="guia-section">
          <h3>Ver estado de un escrito</h3>
          <p>1. Acceda al menú "Mis presentaciones".</p>
          <p>2. Busque el escrito enviado.</p>
          <p>3. Verifique su estado.</p>
        </section>
      )}

      {accion === "notificaciones" && (
        <section className="guia-section">
          <h3>Revisar notificaciones</h3>
          <p>1. Ingrese a "Notificaciones electrónicas".</p>
          <p>2. Lea las notificaciones pendientes.</p>
        </section>
      )}

      {accion === "audiencias" && (
        <section className="guia-section">
          <h3>Consultar audiencias</h3>
          <p>1. Diríjase a "Agenda de audiencias".</p>
        </section>
      )}
    </div>
  );
}
