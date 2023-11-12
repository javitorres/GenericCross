function createChartContainer(title, identifier, index, type) {
    var elementId = 'chart-' + (Array.isArray(identifier) ? identifier.join("-") : identifier);
    var container = document.createElement('div');
    container.className = 'chart-container column is-half';
    container.id = elementId;

    var header = document.createElement('header');
    header.className = 'card-header';
    var titleElement = document.createElement('p');
    titleElement.className = 'card-header-title';
    titleElement.innerText = title;
    header.appendChild(titleElement);
    container.appendChild(header);

    if (type === 'numerical') {

        // Crear y añadir el contenedor de entradas para el rango mínimo y máximo
        var rangeContainer = document.createElement('div');
        rangeContainer.className = 'range-container';

        var minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'input is-small';
        minInput.placeholder = 'Min';
        minInput.onchange = function() { setChartDomain(elementId, 'min', minInput.value); };

        var maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'input is-small';
        maxInput.placeholder = 'Max';
        maxInput.onchange = function() { setChartDomain(elementId, 'max', maxInput.value); };

        rangeContainer.appendChild(minInput);
        rangeContainer.appendChild(maxInput);
        container.appendChild(rangeContainer);
    }

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

function setChartDomain(chartId, type, value) {
    var chart = dc.chartRegistry.list().filter(c => c.anchor() === '#' + chartId)[0];
    if (!chart) return;

    var domain = chart.x().domain();
    var newValue = parseFloat(value);

    // Asegúrate de que el valor sea un número válido antes de actualizar
    if (isNaN(newValue)) return;

    if (type === 'min' && newValue < domain[1]) {
        chart.x().domain([newValue, domain[1]]);
    } else if (type === 'max' && newValue > domain[0]) {
        chart.x().domain([domain[0], newValue]);
    } else {
        // No actualices si el mínimo es mayor que el máximo o viceversa
        return;
    }

    // Reajusta el eje si es necesario
    chart.rescale();
    chart.redraw();
}


function generateChart(chartConfig, dimension, group, index) {
    var elementId = createChartContainer(chartConfig.title, chartConfig.columnName, index,  chartConfig.type);
    var chart;
    // set reasonableMaxValue to mean + (5 * standard deviation) for numerical charts
    //var reasonableMaxValue = chartConfig.type === 'numerical' ? d3.mean(group.all(), d => d.value) + (5 * d3.deviation(group.all(), d => d.value)) : d3.max(group.all(), d => d.key);
    var reasonableMaxValue = d3.max(group.all(), d => d.key);
    
    console.log(chartConfig.columnName + ': ' + reasonableMaxValue);
    switch (chartConfig.type) {
        case 'numerical':
            chart = dc.barChart('#' + elementId)
                .dimension(dimension)
                .group(group)
                .x(d3.scaleLinear().domain([0, reasonableMaxValue]))
                .elasticY(true);
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
                .x(d3.scaleTime().domain(d3.extent(group.all(), d => d.key)))
                .elasticY(true);
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

    chart.on('filtered', function(chart) {
        updateFiltersSummary();
    });

    return chart;
}

function updateFiltersSummary() {
    var filtersList = dc.chartRegistry.list().reduce(function (acc, chart) {
        var filters = chart.filters();
        if (filters.length > 0) {
            acc.push({chart: chart.anchor(), filters: filters});
        }
        return acc;
    }, []);

    var filtersListElement = document.getElementById('filters-list');
    filtersListElement.innerHTML = ''; // Limpiar el listado actual

    filtersList.forEach(function(item) {
        var li = document.createElement('li');
        li.textContent = item.chart + ': ' + item.filters.join(', ');
        filtersListElement.appendChild(li);
    });
}


function resetChart(elementId) {
    var chart = dc.chartRegistry.list().find(c => c.anchor() === '#' + elementId);
    if (chart) {
        chart.filterAll();
        dc.redrawAll();
    }
}

function createDataTable(crossFilterData, config) {
    var dataTable = dc.dataTable("#data-table");
    var allDim = crossFilterData.dimension(d => d);

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

    setTimeout(function() {
        d3.selectAll('#data-table .dc-data-table').classed('dc-table', true);
    }, 0);

    return dataTable;
}

function createRelationChart(relationConfig, crossFilterData, index, data) {
    if (!Array.isArray(relationConfig.fields)) {
        console.error("Error: 'fields' should be an array", relationConfig.fields);
        return;
    }

    var elementId = createChartContainer(relationConfig.title, relationConfig.fields, index);
    var dimension = crossFilterData.dimension(d => [d[relationConfig.fields[0]], d[relationConfig.fields[1]]]);
    var group = dimension.group();

    var chart = dc.scatterPlot('#' + elementId)
        .dimension(dimension)
        .group(group)
        .x(d3.scaleLinear().domain([0, d3.max(data, d => d[relationConfig.fields[0]])]))
        .y(d3.scaleLinear().domain([0, d3.max(data, d => d[relationConfig.fields[1]])]))
        .elasticX(true)
        .elasticY(true);
    
    var resetLink = document.createElement('a');
    resetLink.className = 'reset-link button is-small';
    resetLink.innerText = 'Reset';
    resetLink.href = 'javascript:resetChart("' + elementId + '")';
    document.getElementById(elementId).appendChild(resetLink);

    chart.on('renderlet', function(chart) {
        resetLink.style.display = chart.filters().length > 0 ? 'block' : 'none';
    });

    chart.on('filtered', function(chart) {
        updateFiltersSummary();
    });


    return chart;
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

        var crossFilterData = crossfilter(data);
        var charts = config.charts.map((chartConfig, index) => {
            return generateChart(chartConfig, crossFilterData.dimension(dc.pluck(chartConfig.columnName)), crossFilterData.dimension(dc.pluck(chartConfig.columnName)).group().reduceCount(), index);
        });

        if (config.relations) {
            config.relations.forEach((relationConfig, index) => {
                createRelationChart(relationConfig, crossFilterData, charts.length + index, data);
            });
        }

        var dataTable = createDataTable(crossFilterData, config);
        dc.renderAll();

        document.getElementById('reset-all').addEventListener('click', function() {
            dc.filterAll();
            dc.redrawAll();
        });
    });
}
