
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const buttons = document.querySelectorAll('.botoes button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-section');
            sections.forEach(sec => {
                sec.style.display = sec.id === target ? 'block' : 'none';
            });
        });
    });
    // Activate first
    buttons[0].click();
    renderCharts();
    loadSatisfaction();
});

async function fetchJson(file) {
    const res = await fetch('/' + file);
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
}

let clusterChart, campanhaChart;

async function renderCharts() {
    const clusterData = await fetchJson('cluster_points.json');
    const clusterDiag = await fetchJson('cluster_diagnostico.json');
    const campData = await fetchJson('preferencias_campanhas.json');
    const regData = await fetchJson('regression_coeffs.json');
    const clvData = await fetchJson('clv_segments.json');

    // Cluster scatter
    const ctx1 = document.getElementById('clusterChart').getContext('2d');
    clusterChart = new Chart(ctx1, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Clusters',
          data: clusterData.map(p => ({x: p.pca1, y: p.pca2})),
          backgroundColor: clusterData.map(p => ['#FF6384','#36A2EB','#FFCE56'][p.cluster])
        }]
      },
      options: { scales: { x: { title: { display: true, text: 'PCA1' }}, y: { title: { display: true, text: 'PCA2' }}}}
    });

    // Cluster diag
    const ctx2 = document.getElementById('clusterDiagChart').getContext('2d');
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: clusterDiag.map(c => 'Cluster ' + c.cluster),
        datasets: [
          { label: 'Freq Compras', data: clusterDiag.map(c => c.frequencia_compras) },
          { label: 'Total Gasto', data: clusterDiag.map(c => c.total_gasto) },
          { label: 'Última Compra', data: clusterDiag.map(c => c.ultima_compra) }
        ]
      }
    });

    // Campanha
    const ctx3 = document.getElementById('campanhaChart').getContext('2d');
    campanhaChart = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: campData.map(c => c.campanha),
        datasets: [
          { label: 'Gasto Médio/Cliente', data: campData.map(c => c.gasto_medio_por_cliente) },
          { label: 'ROI', data: campData.map(c => c.roi_estimado) }
        ]
      }
    });

    // Regression
    const ctx4 = document.getElementById('regressionChart').getContext('2d');
    new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: regData.map(r => r.variable),
        datasets: [{ label: 'Coeficiente', data: regData.map(r => r.coefficient) }]
      }
    });

    // CLV
    const ctx5 = document.getElementById('clvChart').getContext('2d');
    new Chart(ctx5, {
      type: 'pie',
      data: { labels: clvData.map(c => c.segmento_valor||c.index), datasets: [{ data: clvData.map(c => c.count) }] }
    });
}

async function loadSatisfaction() {
    const container = document.getElementById('tableContainer');
    try {
        const data = await fetchJson('satisfacao.json');
        // build table
        const table = document.createElement('table');
        const thead = table.createTHead();
        const hrow = thead.insertRow();
        ['Campanha', 'Satisfação Média'].forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            hrow.appendChild(th);
        });
        const tbody = table.createTBody();
        data.forEach(r => {
            const tr = tbody.insertRow();
            const td1 = tr.insertCell(); td1.textContent = r.campanha;
            const td2 = tr.insertCell(); td2.textContent = r.satisfacao_media.toFixed(2);
        });
        container.innerHTML = '';
        container.appendChild(table);
    } catch (err) {
        container.innerHTML = `<div class="erro">Erro ao carregar satisfação: ${err.message}</div>`;
    }
}
