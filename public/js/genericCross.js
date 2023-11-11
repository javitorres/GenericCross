

function createChartContainer(chartConfig, index) {
    var elementId = 'chart-' + chartConfig.columnName;
    var container = document.createElement('div');
    container.className = 'chart-container column is-half';
    container.id = elementId;

    if (index % 2 === 0) {
        var row = document.createElement('div');
        row.className = 'columns';
        row.id = 'row-' + Math.floor(index / 2);
        document.getElementById('charts-container').appendChild(row);
    }

    var rowContainer = document.getElementById('row-' + Math.floor(index / 2));
    rowContainer.appendChild(container);
    return elementId;
}

function generateChart(chartConfig, dimension, group, elementId) {
    var chart;
    switch (chartConfig.type) {
        case 'numerical':
            chart = dc.barChart('#' + elementId)
                .dimension(dimension)
                .group(group)
                .x(d3.scaleLinear().domain([0, d3.max(group.all(), d => d.key)]));
            break;
        case 'categorical':
            chart = dc.pieChart('#' + elementId)
                .dimension(dimension)
                .group(group);
            break;
        case 'date':
            chart = dc.lineChart('#' + elementId)
                .dimension(dimension)
                .group(group)
                .x(d3.scaleTime().domain(d3.extent(group.all(), d => d.key)));
            break;
        default:
            throw new Error('Tipo no soportado');
    }

    var resetLink = document.createElement('a');
    resetLink.className = 'reset-link button is-small';
    resetLink.innerText = 'Reset';
    resetLink.href = 'javascript:resetChart("' + elementId + '")';
    document.getElementById(elementId).appendChild(resetLink);

    chart.on('renderlet', function(chart) {
        resetLink.style.display = chart.filters().length > 0 ? 'block' : 'none';
    });

    return chart;
}

function resetChart(elementId) {
    var chart = dc.chartRegistry.list().find(c => c.anchor() === '#' + elementId);
    if (chart) {
        chart.filterAll();
        dc.redrawAll();
    }
}
function initializeDashboard(config) {
    d3.csv(config.data).then((data) => {
        data.forEach(function (d) {
            config.charts.forEach(function (chartConfig) {
                if (chartConfig.type === 'date') {
                    d[chartConfig.columnName] = new Date(d[chartConfig.columnName]);
                } else if (chartConfig.type === 'numerical') {
                    d[chartConfig.columnName] = +d[chartConfig.columnName];
                }
            });
        });

        var ndx = crossfilter(data);
        var charts = config.charts.map((chartConfig, index) => {
            var elementId = createChartContainer(chartConfig, index);
            var dimension = ndx.dimension(dc.pluck(chartConfig.columnName));
            var group = dimension.group().reduceCount();
            return generateChart(chartConfig, dimension, group, elementId);
        });

        dc.renderAll();
    });
}