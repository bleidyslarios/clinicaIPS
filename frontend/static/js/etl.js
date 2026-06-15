/* etl.js — Ejecución ETL, subida de archivo, historial */

async function ejecutarETL() {
  const btn = document.getElementById('btn-run-etl');
  const progress = document.getElementById('etl-progress');
  const resultado = document.getElementById('etl-resultado');

  btn.disabled = true;
  progress.classList.add('active');
  resultado.classList.remove('active');

  try {
    const res = await authFetch('/api/etl/run/', { method: 'POST' });
    if (!res) return;
    const data = await res.json();

    if (res.ok) {
      mostrarResultado(data);
      cargarHistorial();
      cargarEstadisticasReales();
    } else {
      mostrarErrorDetallado(data, res.status);
    }
  } catch(e) {
    mostrarErrorConexion(e.message);
  } finally {
    btn.disabled = false;
    progress.classList.remove('active');
  }
}

async function subirDataset() {
  const input = document.getElementById('archivo-dataset');
  if (!input.files.length) { alert('Selecciona un archivo primero.'); return; }

  const formData = new FormData();
  formData.append('archivo', input.files[0]);

  const progress = document.getElementById('etl-progress');
  progress.classList.add('active');

  try {
    const csrfToken = getCsrfToken();

    const res = await authFetch('/api/etl/upload/', {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      body: formData
    });

    if (!res) return;

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      mostrarResultado(data);
      cargarHistorial();
      cargarEstadisticasReales();
    } else {
      mostrarErrorDetallado(data, res.status);
    }
  } catch (e) {
    mostrarErrorConexion(e.message);
  } finally {
    progress.classList.remove('active');
  }
}

function handleFileSelect(input) {
  const zone = document.getElementById('upload-zone');
  const displayName = document.getElementById('file-name-display');
  if (input.files.length) {
    zone.classList.add('has-file');
    displayName.textContent = input.files[0].name;
  } else {
    zone.classList.remove('has-file');
  }
}

function mostrarErrorDetallado(data, statusCode) {
  const resultado = document.getElementById('etl-resultado');
  resultado.classList.add('active');

  const badge = document.getElementById('etl-status-badge');
  badge.className = 'etl-status-badge etl-status--error';
  badge.textContent = 'Error';

  const detalle = data.detalle || data.message || data.error || 'Error desconocido';
  const tipo = data.tipo || 'Error';

  document.getElementById('etl-metricas').innerHTML = `
    <div style="grid-column: 1 / -1;">
      <div style="background:rgba(255,95,109,0.05); border:1px solid rgba(255,95,109,0.15); border-radius:12px; padding:1.25rem; color:#1a2635;">
        <div style="font-weight:700; margin-bottom:0.4rem; color:#ff375f;">
          <i class="bi bi-exclamation-triangle-fill me-1"></i>Error al subir archivo (${statusCode})
        </div>
        <div style="font-size:0.85rem; color:#8899aa;">${tipo}: ${detalle}</div>
      </div>
    </div>
  `;
  document.getElementById('etl-log').textContent = 'Sin log disponible';
}

function mostrarErrorConexion(mensaje) {
  const resultado = document.getElementById('etl-resultado');
  resultado.classList.add('active');

  const badge = document.getElementById('etl-status-badge');
  badge.className = 'etl-status-badge etl-status--error';
  badge.textContent = 'Error de conexión';

  document.getElementById('etl-metricas').innerHTML = `
    <div style="grid-column: 1 / -1;">
      <div style="background:rgba(249,115,22,0.05); border:1px solid rgba(249,115,22,0.15); border-radius:12px; padding:1.25rem; color:#1a2635;">
        <div style="font-weight:700; margin-bottom:0.4rem; color:#ea580c;">
          <i class="bi bi-wifi-off me-1"></i>Error de conexión
        </div>
        <div style="font-size:0.85rem; color:#8899aa;">${mensaje}</div>
      </div>
    </div>
  `;
  document.getElementById('etl-log').textContent = 'Sin log disponible';
}

function mostrarResultado(data) {
  const sec = document.getElementById('etl-resultado');
  sec.classList.add('active');

  const badge = document.getElementById('etl-status-badge');
  if (data.estado === 'completado') {
    badge.className = 'etl-status-badge etl-status--completado';
    badge.textContent = 'Completado';
  } else {
    badge.className = 'etl-status-badge etl-status--error';
    badge.textContent = 'Error';
  }

  document.getElementById('etl-metricas').innerHTML = `
    <div class="etl-metric-item">
      <div class="value">${data.registros_entrada ?? 0}</div>
      <div class="label">Registros Entrada</div>
    </div>
    <div class="etl-metric-item etl-metric-item--limpios">
      <div class="value">${data.registros_limpios ?? 0}</div>
      <div class="label">Registros Limpios</div>
    </div>
    <div class="etl-metric-item etl-metric-item--duplicados">
      <div class="value">${data.duplicados_eliminados ?? 0}</div>
      <div class="label">Duplicados</div>
    </div>
    <div class="etl-metric-item etl-metric-item--tiempo">
      <div class="value">${data.tiempo_ejecucion_seg ?? 0}s</div>
      <div class="label">Tiempo</div>
    </div>
  `;

  document.getElementById('etl-log').textContent = data.log_detalle || 'Sin log disponible';
}

async function cargarEstadisticasReales() {
  try {
    const res = await authFetch('/api/etl/stats/');
    if (!res || !res.ok) return;
    const stats = await res.json();

    animateValue('stat-total-ejec', stats.total_ejecuciones || 0);
    animateValue('stat-total-limpios', stats.total_limpios || 0);
    animateValue('stat-total-duplicados', stats.total_duplicados || 0);
    document.getElementById('stat-promedio-tiempo').textContent =
      (stats.promedio_tiempo || 0) + 's';
  } catch(e) {
    console.error('Error cargando stats ETL:', e);
  }
}

async function cargarHistorial() {
  try {
    const res = await authFetch('/api/etl/historial/');
    if (!res) return;
    const data = await res.json();

    const tbody = document.getElementById('historial-tbody');

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          Sin registros ETL
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(r => `
      <tr>
        <td style="font-size:0.82rem;">${formatFecha(r.fecha_ejecucion)}</td>
        <td style="font-size:0.82rem;">${r.usuario_nombre || '—'}</td>
        <td><span style="background:rgba(136,153,170,0.12); color:#5a6577; padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:600;">${r.registros_entrada}</span></td>
        <td><span style="background:rgba(16,185,129,0.1); color:#059669; padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:600;">${r.registros_limpios}</span></td>
        <td><span style="background:rgba(249,115,22,0.1); color:#ea580c; padding:0.25rem 0.6rem; border-radius:6px; font-size:0.75rem; font-weight:600;">${r.duplicados_eliminados}</span></td>
        <td style="font-size:0.82rem; color:#8899aa;">${r.tiempo_ejecucion_seg}s</td>
        <td><span class="etl-status-badge ${badgeEstado(r.estado)}">${r.estado}</span></td>
      </tr>
    `).join('');
  } catch(e) {
    console.error('Error historial:', e);
  }
}

function animateValue(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff = target - start;
  if (diff === 0) return;
  const duration = 600;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + diff * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function formatFecha(f) {
  return f ? new Date(f).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' }) : '—';
}

function badgeEstado(e) {
  const map = {
    completado: 'etl-status--completado',
    error: 'etl-status--error',
    en_proceso: 'etl-status--proceso',
    pendiente: 'etl-status--pendiente'
  };
  return map[e] || 'etl-status--pendiente';
}

function getCsrfToken() {
  const name = 'csrftoken';
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (const c of cookies) {
    const cookie = c.trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return '';
}

async function generarDataset() {
  const btn = document.getElementById('btn-generar-dataset');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>Generando...';
  try {
    const res = await authFetch('/api/etl/generar-dataset/', { method: 'POST' });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      alert('Dataset generado correctamente. Ejecuta el ETL para procesarlo.');
    } else {
      alert('Error: ' + (data.error || 'Desconocido'));
    }
  } catch {
    alert('Error de conexión al generar dataset');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-plus-circle"></i>Generar Dataset';
}

document.addEventListener('DOMContentLoaded', () => {
  cargarEstadisticasReales();
  cargarHistorial();
});
