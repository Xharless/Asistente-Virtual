import React, { useState } from "react";
import "./guiaOJV.css";

export default function GuiaOJV() {
  const [accion, setAccion] = useState("");

  return (
    <div className="guia-container">
      <h2>Guía de la Oficina Judicial Virtual</h2>
      <p className="intro">
        Seleccione una acción para ver una guía paso a paso.
      </p>

      {/* Barra para seleccionar acción */}
      <div className="form-group">
        <label htmlFor="accion">Seleccione acción que necesita realizar:</label>
        <select
          id="accion"
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
        >
          <option value="">-- Seleccione una opción --</option>
          <option value="revisar">Revisar causa</option>
          <option value="escrito">Enviar escrito</option>
          <option value="estado">Ver estado de un escrito</option>
          <option value="notificaciones">Revisar notificaciones</option>
          <option value="audiencias">Consultar audiencias</option>
        </select>
      </div>

      {/* Contenido dinámico dependiendo de la selección */}
      {accion === "revisar" && (
        <section className="guia-section">
          <h3>Revisar causa</h3>
          <p>1. Ingrese al sistema con Clave Única o usuario institucional.</p>
          <p>2. Vaya al menú “Consulta de causas”.</p>
          <p>3. Ingrese el RIT o tribunal correspondiente.</p>
          <p>4. Revise las resoluciones, escritos y documentos asociados.</p>
        </section>
      )}

      {accion === "escrito" && (
        <section className="guia-section">
          <h3>Enviar escrito</h3>
          <p>1. Seleccione la causa donde ingresará el escrito.</p>
          <p>2. Haga clic en “Presentar escrito”.</p>
          <p>3. Seleccione el tipo de escrito desde la lista.</p>
          <p>4. Adjunte el documento PDF correspondiente.</p>
          <p>5. Envíe el escrito y espere la confirmación del sistema.</p>
        </section>
      )}

      {accion === "estado" && (
        <section className="guia-section">
          <h3>Ver estado de un escrito</h3>
          <p>1. Acceda al menú “Mis presentaciones”.</p>
          <p>2. Busque el escrito enviado.</p>
          <p>3. Verifique si fue “Recibido”, “Rechazado” o “A la espera”.</p>
        </section>
      )}

      {accion === "notificaciones" && (
        <section className="guia-section">
          <h3>Revisar notificaciones</h3>
          <p>1. Ingrese a “Notificaciones electrónicas”.</p>
          <p>2. Revise las notificaciones pendientes de lectura.</p>
          <p>3. Descargue los documentos si corresponde.</p>
        </section>
      )}

      {accion === "audiencias" && (
        <section className="guia-section">
          <h3>Consultar audiencias</h3>
          <p>1. Diríjase a “Agenda de audiencias”.</p>
          <p>2. Ingrese número de causa o tribunal.</p>
          <p>3. Revise fecha, participantes y observaciones.</p>
        </section>
      )}
    </div>
  );
}

