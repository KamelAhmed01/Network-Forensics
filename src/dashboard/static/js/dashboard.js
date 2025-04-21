// Global chart references
let timeseriesChart = null;
let protocolChart = null;

// Format timestamp to readable time
function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString();
}

// Update last updated timestamp
function updateLastUpdated(timestamp) {
    const element = document.getElementById('last-updated');
    if (timestamp) {
        const date = new Date(timestamp);
        element.textContent = `Last updated: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else {
        const now = new Date();
        element.textContent = `Last updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    }
}

// Initialize timeseries chart
function initTimeseriesChart() {
    const ctx = document.getElementById('timeseries-chart').getContext('2d');
    timeseriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Anomalies',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}

// Initialize protocol distribution chart
function initProtocolChart() {
    const ctx = document.getElementById('protocol-chart').getContext('2d');
    protocolChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// Update anomalies table
function updateAnomaliesTable(anomalies) {
    const tbody = document.querySelector('#anomalies-table tbody');
    tbody.innerHTML = '';

    if (anomalies && anomalies.length > 0) {
        anomalies.slice().reverse().slice(0, 10).forEach(anomaly => {
            const row = document.createElement('tr');
            row.className = anomaly.score < -0.5 ? 'severe-alert-row' : 'alert-row';

            row.innerHTML = `
                <td>${formatTime(anomaly.timestamp)}</td>
                <td>${anomaly.src_ip}</td>
                <td>${anomaly.dst_ip}</td>
                <td>${anomaly.proto}</td>
                <td>${anomaly.packets}</td>
                <td>${anomaly.bytes}</td>
                <td>${anomaly.score.toFixed(4)}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align: center;">No anomalies detected yet</td>';
        tbody.appendChild(row);
    }
}

// Update IP source list
function updateSourcesList(sources) {
    const container = document.getElementById('top-sources');
    container.innerHTML = '';

    if (!sources || Object.keys(sources).length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }

    const sourceItems = Object.entries(sources)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count);

    const list = document.createElement('ul');
    sourceItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="ip-address">${item.ip}</span>
            <span class="ip-count">${item.count}</span>
        `;
        list.appendChild(listItem);
    });

    container.appendChild(list);
}

// Update protocol distribution chart
function updateProtocolChart(protocolData) {
    if (!protocolData || Object.keys(protocolData).length === 0) {
        return;
    }

    const labels = Object.keys(protocolData);
    const data = Object.values(protocolData);

    protocolChart.data.labels = labels;
    protocolChart.data.datasets[0].data = data;
    protocolChart.update();
}

// Update timeseries chart
function updateTimeseriesChart(timeseriesData) {
    if (!timeseriesData || timeseriesData.length === 0) {
        return;
    }

    const labels = timeseriesData.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString();
    });

    const data = timeseriesData.map(item => item.count);

    timeseriesChart.data.labels = labels;
    timeseriesChart.data.datasets[0].data = data;
    timeseriesChart.update();
}

// Update summary statistics
function updateSummaryStats(stats) {
    if (!stats) return;

    document.getElementById('total-anomalies').textContent = stats.total_anomalies || 0;
    document.getElementById('avg-score').textContent =
        stats.average_anomaly_score ? stats.average_anomaly_score.toFixed(4) : '-';
}

// Fetch and update all dashboard data
function updateDashboard() {
    // Fetch anomalies
    fetch('/api/anomalies')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching anomalies:', data.error);
                return;
            }

            updateAnomaliesTable(data.anomalies);
            updateLastUpdated(data.last_updated);
        })
        .catch(error => console.error('Error fetching anomalies:', error));

    // Fetch statistics
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching stats:', data.error);
                return;
            }

            updateSummaryStats(data.stats);
            updateSourcesList(data.stats.top_source_ips);
            updateProtocolChart(data.stats.protocol_distribution);
        })
        .catch(error => console.error('Error fetching stats:', error));

    // Fetch timeseries data
    fetch('/api/timeseries')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error fetching timeseries:', data.error);
                return;
            }

            updateTimeseriesChart(data.timeseries);
        })
        .catch(error => console.error('Error fetching timeseries:', error));
}

// Initialize charts and start update cycle
document.addEventListener('DOMContentLoaded', function() {
    initTimeseriesChart();
    initProtocolChart();
    updateDashboard();

    // Get update interval from HTML (passed from Flask)
    const updateInterval = parseInt(document.querySelector('.refresh-time').textContent.match(/\\d+/)[0]) * 1000;
    setInterval(updateDashboard, updateInterval);
});
