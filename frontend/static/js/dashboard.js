/* dashboard.js — KPIs, gráficas Chart.js */

const COLORES_RIESGO = {
  bajo:    '#198754',
  medio:   '#ffc107',
  alto:    '#fd7e14',
  critico: '#dc3545',
};

async function cargarDashboard() {
  try {
    const res = await authFetch('/api/dashboard/kpis/');
    if (!res || !res.ok) return;
    const data = await res.json();

    // KPIs principales
    const k = data.kpis;
    setText('kpi-total',       k.total_pacientes ?? '—');
    setText('kpi-criticos',    `${k.pacientes_criticos ?? '—'} (${k.pct_criticos ?? 0}%)`);
    setText('kpi-hipertensos', `${k.pacientes_hipertensos ?? '—'} (${k.pct_hipertensos ?? 0}%)`);
    setText('kpi-diabeticos',  `${k.pacientes_diabeticos ?? '—'} (${k.pct_diabeticos ?? 0}%)`);
    setText('kpi-fumadores',   k.pacientes_fumadores ?? '—');
    setText('pct-fumadores',   `${k.pct_fumadores ?? 0}% del total`);

    const avg = k.promedios || {};
    setText('kpi-imc',    avg.avg_imc     ? avg.avg_imc.toFixed(1) : '—');
    setText('kpi-glucosa', avg.avg_glucosa ? avg.avg_glucosa.toFixed(1) + ' mg/dL' : '—');

    // Estado ETL
    const etl = data.ultimo_etl;
    document.getElementById('etl-status').innerHTML = etl?.fecha
      ? `<div class="d-flex gap-3 flex-wrap">
           <div><div class="text-muted small">Última ejecución</div>
                <div class="fw-semibold">${formatFecha(etl.fecha)}</div></div>
           <div><div class="text-muted small">Registros</div>
                <div class="fw-semibold">${etl.registros}</div></div>
           <div><div class="text-muted small">Estado</div>
                <span class="badge ${badgeEstado(etl.estado)}">${etl.estado}</span></div>
         </div>`
      : '<span class="text-muted small">Sin ejecuciones registradas</span>';

    // Estado Modelo ML
    const ml = data?.modelo_activo;
    document.getElementById('ml-status').innerHTML = ml?.nombre
      ? `<div class="d-flex gap-3 flex-wrap">
           <div><div class="text-muted small">Modelo</div>
                <div class="fw-semibold">${ml.nombre}</div></div>
           <div><div class="text-muted small">Accuracy</div>
                <div class="fw-semibold text-success">${ml.accuracy != null ? (ml.accuracy*100).toFixed(1)+'%' : '—'}</div></div>
         </div>`
      : '<span class="text-muted small">No hay modelos entrenados</span>';

    // Gráficas
    renderGraficaRiesgo(data.graficas.distribucion_riesgo);
    renderGraficaEdad(data.graficas.segmentacion_edad);
    renderGraficaIMC(data.graficas.distribucion_imc);
    renderGraficaDiagnosticos(data.graficas.top_diagnosticos);
    renderGraficaTendencia(data.graficas.tendencia_consultas);
    renderHeatmap(data.graficas.heatmap_edad_riesgo);

  } catch(e) {
    console.error('Error cargando dashboard:', e);
  }
}

function renderGraficaRiesgo(data) {
  if (!data) return;
  const labels = Object.keys(data);
  const values = Object.values(data);
  new Chart(document.getElementById('chart-riesgo'), {
    type: 'doughnut',
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{ data: values, backgroundColor: labels.map(l => COLORES_RIESGO[l] || '#6c757d'),
                   borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderGraficaEdad(data) {
  if (!data?.length) return;
  new Chart(document.getElementById('chart-edad'), {
    type: 'bar',
    data: {
      labels: data.map(d => d.rango_edad),
      datasets: [{ label: 'Pacientes', data: data.map(d => d.total),
                   backgroundColor: '#0d6efd99', borderColor: '#0d6efd',
                   borderWidth: 1, borderRadius: 6 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } },
               scales: { y: { beginAtZero: true, grid: { color: '#f0f0f0' } } } }
  });
}

function renderGraficaIMC(data) {
  if (!data || !Object.keys(data).length) return;
  const labels = { bajo_peso:'Bajo Peso', normal:'Normal', sobrepeso:'Sobrepeso', obesidad:'Obesidad' };
  const colors = { bajo_peso:'#0dcaf0', normal:'#198754', sobrepeso:'#ffc107', obesidad:'#dc3545' };
  const keys = Object.keys(data);
  new Chart(document.getElementById('chart-imc'), {
    type: 'pie',
    data: {
      labels: keys.map(k => labels[k] || k),
      datasets: [{ data: Object.values(data),
                   backgroundColor: keys.map(k => colors[k] || '#6c757d'),
                   borderWidth: 2, borderColor: '#fff' }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderGraficaDiagnosticos(data) {
  if (!data?.length) return;
  new Chart(document.getElementById('chart-diagnosticos'), {
    type: 'bar',
    data: {
      labels: data.map(d => d.diagnostico_preliminar || 'Sin diagnóstico'),
      datasets: [{ label: 'Casos', data: data.map(d => d.total),
                   backgroundColor: '#6610f299', borderColor: '#6610f2',
                   borderWidth: 1, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, grid: { color: '#f0f0f0' } } }
    }
  });
}

function renderGraficaTendencia(data) {
  if (!data?.length) return;
  new Chart(document.getElementById('chart-tendencia'), {
    type: 'line',
    data: {
      labels: data.map(d => d.mes),
      datasets: [{
        label: 'Consultas',
        data: data.map(d => d.total),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.08)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#0d6efd',
        pointRadius: 4,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
        x: { grid: { display: false } }
      }
    }
  });
}

const COLORES_HEATMAP = ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#08306b'];
const ETIQUETAS_RIESGO = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico' };

function renderHeatmap(data) {
  const container = document.getElementById('heatmap-container');
  if (!data || !data.datos?.length) {
    container.innerHTML = '<div class="text-center text-muted py-4 small">Sin datos</div>';
    return;
  }

  const maxVal = Math.max(...data.datos.flat(), 1);
  const idxColor = v => Math.min(Math.floor((v / maxVal) * COLORES_HEATMAP.length), COLORES_HEATMAP.length - 1);

  let html = '<div style="overflow-x:auto"><table style="width:100%;font-size:11px;border-collapse:collapse">';
  html += '<tr><td style="padding:4px;font-weight:600;color:#6c757d">Edad \\ Riesgo</td>';
  data.riesgos.forEach(r => {
    html += `<td style="padding:4px;text-align:center;font-weight:600;color:#6c757d;font-size:10px">${ETIQUETAS_RIESGO[r] || r}</td>`;
  });
  html += '</tr>';

  data.datos.forEach((fila, i) => {
    html += `<tr><td style="padding:4px;font-weight:500;color:#495057;white-space:nowrap">${data.rangos[i]}</td>`;
    fila.forEach(val => {
      const ci = idxColor(val);
      html += `<td style="padding:6px;text-align:center;background:${COLORES_HEATMAP[ci]};color:${ci > 2 ? '#fff' : '#212529'};font-weight:${val > 0 ? '600' : '400'};border-radius:4px">${val}</td>`;
    });
    html += '</tr>';
  });

  html += '</table></div>';
  container.innerHTML = html;
}

// Helpers
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function formatFecha(f) {
  return f ? new Date(f).toLocaleString('es-CO', { dateStyle:'medium', timeStyle:'short' }) : '—';
}
function badgeEstado(e) {
  return { completado:'bg-success', error:'bg-danger', en_proceso:'bg-warning text-dark',
           pendiente:'bg-secondary' }[e] || 'bg-secondary';
}

document.addEventListener('DOMContentLoaded', cargarDashboard);
