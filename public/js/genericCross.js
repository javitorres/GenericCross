

function createChartContainer(chartConfig, index) {
    var elementId = 'chart-' + chartConfig.columnName;
    var container = document.createElement('div');
    container.className = 'chart-container column is-half';
    container.id = elementId;

    // Crear el contenedor principal del gráfico
    var container = document.createElement('div');
    container.className = 'chart-container column is-half';
    container.id = elementId;

    // Crear el encabezado del gráfico
    var header = document.createElement('header');
    header.className = 'card-header';

    // Crear el título del gráfico
    var title = document.createElement('p');
    title.className = 'card-header-title';
    title.innerText = chartConfig.title;

    // Añadir el título al encabezado y el encabezado al contenedor
    header.appendChild(title);
    container.appendChild(header);

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

function createDataTable(ndx, config) {
    var dataTable = dc.dataTable("#data-table");
    var allDim = ndx.dimension(d => d);

    var columns = config.charts.map(chartConfig => {
        return {
            label: chartConfig.columnName,
            format: d => d[chartConfig.columnName]
        };
    });

    dataTable
        .dimension(allDim)
        .columns(columns)
        .sortBy(d => d[columns[0].label]) // Ordenar por la primera columna como predeterminado
        .order(d3.ascending)
        .on('renderlet', function(table) {
            // Añadir evento click a cada cabecera para controlar la ordenación
            table.selectAll('.dc-table th')
                .on('click', function(d) {
                    var column = d.label;
                    if (dataTable.order() === d3.ascending) {
                        dataTable.order(d3.descending);
                    } else {
                        dataTable.order(d3.ascending);
                    }
                    dataTable.sortBy(d => d[column]);
                    dataTable.redraw();
                });
                table.selectAll('.dc-table').classed('dc-table', true);
        });

        // Intenta aplicar la clase directamente después de que dc.js renderiza la tabla
        setTimeout(function() {
            d3.selectAll('#data-table .dc-data-table').classed('dc-table', true);
        }, 0);

    return dataTable;
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

        var dataTable = createDataTable(ndx, config);

        dc.renderAll();
    });
}