Ejemplo base:

    https://dc-js.github.io/dc.js/

    Explicacion:
        https://dc-js.github.io/dc.js/docs/stock.html

    Otro ejemplo:
        https://drarmstr.github.io/chartcollection/examples/#worldbank

    Mas ejemplos:
        https://raw.githubusercontent.com/JaelB/

    Chat:
        https://chat.openai.com/c/5c7e66d5-4886-459d-b34f-eb546d35b86b

Arrancar:
    node server.js
    http://localhost:3000/generic

TODO:
    Poder pasarle como parametro la configuración json de la gráfica:

    {
        "data": 'fichero o S3',
        "charts":
            [
                {
                    "title": "Por marca",
                    "type": "cathegorical",
                    "columnName": "marca"
                },
                {
                    "title": "Por modelo",
                    "type": "cathegorical",
                    "columnName": "modelo"
                },
                {
                    "title": "Por potencias",
                    "type": "numeric",
                    "columnName": "potencia"
                },
                {
                    "title": "Por fecha",
                    "type": "date",
                    "columnName": "fecha"
                }
            ]
    }
        
        



