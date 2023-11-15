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


function generateChart(crossFilterData, chartConfig, index, data) {
    var elementId = createChartContainer(chartConfig.title, chartConfig.fields, index,  chartConfig.type);
    var chart;
    
    dimension = crossFilterData.dimension(dc.pluck(chartConfig.fields));
    group =     crossFilterData.dimension(dc.pluck(chartConfig.fields)).group().reduceCount();

    var reasonableMaxValue = d3.max(group.all(), d => d.key);
    
    console.log(chartConfig.fields + ': ' + reasonableMaxValue);
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
                .innerRadius(40)
                .slicesCap(4)
                .group(group)
                .legend(dc.legend().highlightSelected(true));
            break;
        case 'date':
            chart = dc.lineChart('#' + elementId)
                .dimension(dimension)
                .group(group)
                .x(d3.scaleTime().domain(d3.extent(group.all(), d => d.key)))
                .elasticY(true);
            break;
        case 'scatter':
            if (!Array.isArray(chartConfig.fields)) {
                console.error("Error: 'fields' should be an array", chartConfig.fields);
                return;
            }
            var dimension = crossFilterData.dimension(d => [d[chartConfig.fields[0]], d[chartConfig.fields[1]]]);
            var group = dimension.group();
        
            var chart = dc.scatterPlot('#' + elementId)
                .dimension(dimension)
                .group(group)
                .x(d3.scaleLinear().domain([0, d3.max(data, d => d[chartConfig.fields[0]])]))
                .y(d3.scaleLinear().domain([0, d3.max(data, d => d[chartConfig.fields[1]])]))
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
            
            break;
        case 'bubble':
            chart = dc.bubbleChart('#' + elementId);

            if (chartConfig.fields.length < 3) {
                console.error("Bubble chart necesita al menos 3 campos en 'fields': x, y, y tamaño de la burbuja");
                return;
            }

            dimension = crossFilterData.dimension(function (d) {
                return [d[chartConfig.fields[0]], d[chartConfig.fields[1]], d[chartConfig.fields[2]]];
            });

            group = dimension.group().reduce(
                // reduceAdd
                function (p, v) {
                    p.count++;
                    p.size += v[chartConfig.fields[2]];
                    return p;
                },
                // reduceRemove
                function (p, v) {
                    p.count--;
                    p.size -= v[chartConfig.fields[2]];
                    return p;
                },
                // reduceInitial
                function () {
                    return { count: 0, size: 0 };
                }
            );

            var maxBubbleSize = d3.max(data, d => d[chartConfig.fields[2]]);
            var minBubbleSize = d3.min(data, d => d[chartConfig.fields[2]]);
            var bubbleScale = d3.scaleSqrt().domain([minBubbleSize, maxBubbleSize]).range([0, chartConfig.maxBubbleSize]);
            console.log('Bubble size range: ' + bubbleScale.range());
            
            chart
                .dimension(dimension)
                .group(group)
                .keyAccessor(d => d.key[0])
                .valueAccessor(d => d.key[1])
                .radiusValueAccessor(d => bubbleScale(d.value.size))
                .x(d3.scaleLinear().domain(d3.extent(data, d => d[chartConfig.fields[0]])))
                .y(d3.scaleLinear().domain(d3.extent(data, d => d[chartConfig.fields[1]])))
                .r(d3.scaleLinear().domain([0, d3.max(data, d => d[chartConfig.fields[2]])]))
                .elasticX(true)
                .elasticY(true);
            break;
        default:
            throw new Error('Type ' + chartConfig.type + ' not supported');
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
            label: chartConfig.fields,
            format: d => d[chartConfig.fields]
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

function initializeDashboard(config) {
    d3.csv(config.data).then((data) => {
        data.forEach(function (d) {
            config.charts.forEach(function (chartConfig) {
                if (chartConfig.type === 'date') {
                    d[chartConfig.fields] = new Date(d[chartConfig.fields]);
                } else if (chartConfig.type === 'numerical') {
                    // Convertir a número
                    d[chartConfig.fields] = +d[chartConfig.fields];
                }
            });
        });

        var crossFilterData = crossfilter(data);
        var charts = config.charts.map((chartConfig, index) => {
            return generateChart(crossFilterData, chartConfig, index, data);
        });

        var dataTable = createDataTable(crossFilterData, config);
        dc.renderAll();

        document.getElementById('reset-all').addEventListener('click', function() {
            dc.filterAll();
            dc.redrawAll();
        });
    });
}
