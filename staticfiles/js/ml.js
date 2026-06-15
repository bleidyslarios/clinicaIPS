/* ml.js — Entrenamiento, metricas, prediccion */

let confusionChart = null;
let metricasChart = null;

function getEl(id) {
  return document.getElementById(id);
}

function safeSetHTML(el, html) {
  if (!el) {
    console.warn('Elemento no encontrado para setear HTML');
    return false;
  }
  el.innerHTML = html;
  return true;
}

async function entrenarModelo() {
  const selectAlgoritmo = getEl('select-algoritmo');
  const btn = getEl('btn-entrenar');
  const progress = getEl('train-progress');

  if (!selectAlgoritmo || !btn || !progress) {
    console.warn('Faltan elementos del DOM para entrenar:', {
      selectAlgoritmo: !!selectAlgoritmo,
      btn: !!btn,
      progress: !!progress
    });
    return;
  }

  const algoritmo = selectAlgoritmo.value;

  btn.disabled = true;
  progress.classList.remove('d-none');

  try {
    const res = await authFetch('/api/ml/entrenar/', {
      method: 'POST',
      body: JSON.stringify({ algoritmo })
    });
    if (!res) return;

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const result = data.result || data || {};

      const metrics = result.metricas || result.metrics || {};
      const matrix = result.matrix || null;

      const unifiedMetricas = {
        accuracy: metrics.accuracy ?? 0,
        precision: metrics.precision ?? 0,
        recall: metrics.recall ?? 0,
        f1_score: metrics.f1_score ?? 0,
        confusion_matrix: metrics.confusion_matrix ?? null,
        clases: metrics.clases ?? null,
        matrix: matrix
      };

      mostrarMetricas(unifiedMetricas, data.modelo, matrix);
      await cargarModelos();
    } else {
      alert('Error: ' + (data.error || 'No se pudo entrenar el modelo'));
    }
  } catch (e) {
    alert('Error de conexion: ' + (e?.message || String(e)));
  } finally {
    btn.disabled = false;
    progress.classList.add('d-none');
  }
}

function mostrarMetricas(metricas, modelo, matrix) {
  const panel = getEl('metricas-panel');
  if (!panel) {
    console.warn('Elemento #metricas-panel no existe en el DOM');
    return;
  }
  if (!metricas || !modelo) {
    console.warn('Datos incompletos para mostrar metricas', { metricas, modelo });
    return;
  }

  const acc = ((metricas?.accuracy ?? 0) * 100).toFixed(1);
  const prec = ((metricas?.precision ?? 0) * 100).toFixed(1);
  const rec = ((metricas?.recall ?? 0) * 100).toFixed(1);
  const f1 = ((metricas?.f1_score ?? 0) * 100).toFixed(1);

  safeSetHTML(panel, `
    <div class="row g-3">
      <div class="col-6">
        <div class="metric-card">
          <div class="metric-label">Accuracy</div>
          <div class="metric-value" style="color:var(--blue);">${acc}%</div>
          <div class="progress mt-2" style="height:4px">
            <div class="progress-bar" style="width:${acc}%"></div>
          </div>
        </div>
      </div>
      <div class="col-6">
        <div class="metric-card">
          <div class="metric-label">Precision</div>
          <div class="metric-value" style="color:var(--emerald);">${prec}%</div>
          <div class="progress mt-2" style="height:4px">
            <div class="progress-bar bg-success" style="width:${prec}%"></div>
          </div>
        </div>
      </div>
      <div class="col-6">
        <div class="metric-card">
          <div class="metric-label">Recall</div>
          <div class="metric-value" style="color:var(--amber);">${rec}%</div>
          <div class="progress mt-2" style="height:4px">
            <div class="progress-bar bg-warning" style="width:${rec}%"></div>
          </div>
        </div>
      </div>
      <div class="col-6">
        <div class="metric-card">
          <div class="metric-label">F1-Score</div>
          <div class="metric-value" style="color:var(--cyan);">${f1}%</div>
          <div class="progress mt-2" style="height:4px">
            <div class="progress-bar bg-info" style="width:${f1}%"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3 text-center">
      <small class="text-muted">Modelo: <strong>${modelo.nombre}</strong></small>
    </div>
  `);

  const confusionSection = getEl('confusion-section');
  if (confusionSection) {
    confusionSection.style.removeProperty('display');
  } else {
    console.warn('Elemento #confusion-section no existe en el DOM');
  }

  const chartMetricas = getEl('chart-metricas');
  if (!chartMetricas) {
    console.warn('Elemento #chart-metricas no existe en el DOM');
  } else {
    if (metricasChart) {
      metricasChart.destroy();
      metricasChart = null;
    }

    metricasChart = new Chart(chartMetricas, {
      type: 'bar',
      data: {
        labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
        datasets: [{
          label: 'Valor (%)',
          data: [acc, prec, rec, f1],
          backgroundColor: ['rgba(37,99,235,0.5)', 'rgba(5,150,105,0.5)', 'rgba(217,119,6,0.5)', 'rgba(8,145,178,0.5)'],
          borderColor: ['#2563eb', '#059669', '#d97706', '#0891b2'],
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', color: '#64748b' }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false }, ticks: { color: '#64748b' } }
        }
      }
    });
  }

  if (matrix && typeof matrix === 'object' && !metricas.confusion_matrix) {
    const clases = Object.keys(matrix);
    const cm = clases.map(k => matrix[k]);
    renderMatrizConfusion(cm, clases);
  } else {
    renderMatrizConfusion(metricas.confusion_matrix, metricas.clases);
  }
}

function renderMatrizConfusion(cm, clases) {
  if (!cm || !clases) return;

  const canvas = getEl('chart-confusion');
  if (!canvas || !canvas.parentElement) {
    console.warn('No existe el contenedor de #chart-confusion en el DOM');
    return;
  }

  if (confusionChart) {
    confusionChart.destroy();
    confusionChart = null;
  }

  let html = '<table class="table table-bordered table-sm text-center small">';
  html += '<thead><tr><th style="color:var(--text-muted);font-weight:600;">Real \\ Pred</th>';
  clases.forEach(c => (html += `<th style="color:var(--text-primary);font-weight:600;">${c}</th>`));
  html += '</tr></thead><tbody>';

  cm.forEach((row, i) => {
    html += `<tr><th style="color:var(--text-secondary);background:#f8fafc;font-weight:600;">${clases[i]}</th>`;
    row.forEach((v, j) => {
      const style = i === j
        ? 'background:#ecfdf5;color:#059669;font-weight:600;'
        : (v > 0 ? 'background:#fef2f2;color:#dc2626;font-weight:600;' : '');
      html += `<td style="${style}">${v}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  canvas.parentElement.innerHTML = '<h6 style="font-size:0.7rem;font-weight:600;color:var(--text-muted);letter-spacing:0.05em;margin-bottom:0.75rem;">MATRIZ DE CONFUSION</h6>' + html;
}

async function predecirPaciente() {
  const inputId = getEl('input-paciente-id');
  const div = getEl('prediccion-resultado');

  if (!inputId || !div) {
    console.warn('Faltan elementos del DOM para predecir:', { inputId: !!inputId, div: !!div });
    return;
  }

  const id = inputId.value;
  if (!id) {
    alert('Ingresa el ID del paciente.');
    return;
  }

  div.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Prediciendo...';

  try {
    const res = await authFetch('/api/ml/predecir/', {
      method: 'POST',
      body: JSON.stringify({ paciente_id: parseInt(id) })
    });

    if (!res) return;

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const colores = { bajo: 'success', medio: 'warning', alto: 'warning', critico: 'danger' };
      const pct = (data.probabilidad * 100).toFixed(1);

      const distHtml = Object.entries(data.distribucion_clases || {})
        .map(([k, v]) => `
          <div class="d-flex justify-content-between small">
            <span style="color:var(--text-secondary);">${k}</span>
            <span class="fw-semibold">${(v * 100).toFixed(1)}%</span>
          </div>
          <div class="progress mb-1" style="height:4px">
            <div class="progress-bar bg-${colores[k] || 'secondary'}" style="width:${(v * 100).toFixed(1)}%"></div>
          </div>
        `)
        .join('');

      const alertClass = data.riesgo_predicho === 'critico' || data.riesgo_predicho === 'alto'
        ? 'danger' : data.riesgo_predicho === 'medio' ? 'warning' : 'success';

      div.innerHTML = `
        <div class="prediction-alert ${alertClass} mt-2">
          <div class="d-flex align-items-center gap-3">
            <div style="font-size:1.5rem;">🩺</div>
            <div class="flex-grow-1">
              <div class="fw-bold">Riesgo Predicho:
                <span class="text-uppercase" style="color:var(--${alertClass === 'danger' ? 'rose' : alertClass === 'warning' ? 'amber' : 'emerald'});">${data.riesgo_predicho}</span>
              </div>
              <div class="small text-muted">Probabilidad: ${pct}%</div>
              <div class="progress mt-1" style="height:6px">
                <div class="progress-bar bg-${alertClass}" style="width:${pct}%"></div>
              </div>
            </div>
          </div>
          <hr class="my-2">
          <div class="small fw-semibold mb-1" style="color:var(--text-secondary);">Distribucion por clases:</div>
          ${distHtml}
        </div>`;
    } else {
      div.innerHTML = `<div class="alert alert-danger">${data.error || 'No se pudo predecir'}</div>`;
    }
  } catch (e) {
    div.innerHTML = `<div class="alert alert-danger">Error: ${(e?.message || String(e))}</div>`;
  }
}

async function cargarModelos() {
  const tbody = getEl('modelos-tbody');
  if (!tbody) {
    console.warn('Elemento #modelos-tbody no existe en el DOM');
    return;
  }

  try {
    const res = await authFetch('/api/ml/modelos/');
    if (!res || !res.ok) return;

    const data = await res.json().catch(() => ([]));

    if (!Array.isArray(data) || !data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4" style="color:var(--text-muted);">Sin modelos entrenados</td></tr>';
      return;
    }

    tbody.innerHTML = data.filter(m => m && typeof m === 'object').map(m => `
      <tr>
        <td class="fw-semibold small">${m.nombre ?? '—'}</td>
        <td><span class="badge bg-info">${String(m.algoritmo ?? '').replace('_', ' ')}</span></td>
        <td style="color:var(--emerald);">${m.accuracy != null ? (m.accuracy * 100).toFixed(1) + '%' : '—'}</td>
        <td style="color:var(--cyan);">${m.f1_score != null ? (m.f1_score * 100).toFixed(1) + '%' : '—'}</td>
        <td class="small text-muted">${formatFecha(m.fecha_entrenamiento)}</td>
        <td>${m.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error(e);
  }
}

function formatFecha(f) {
  return f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

window.entrenarModelo = entrenarModelo;
window.predecirPaciente = predecirPaciente;
window.cargarModelos = cargarModelos;

document.addEventListener('DOMContentLoaded', () => {
  cargarModelos();
});
