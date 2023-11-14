
<div align="center">
  <img src="https://github-production-user-asset-6210df.s3.amazonaws.com/4235424/282159275-8de9f991-40f8-49d0-8f1a-954c5375d114.png" height="300">

  
</div>

<p align="center">
<img src="https://img.shields.io/badge/Version-0.1.0-red" alt="Latest Release">
<img src="https://img.shields.io/badge/Crossfilter2-1.5.2-yellow" alt="Crossfilter">
<img src="https://img.shields.io/badge/D3-5.15-green" alt="D3JS">
</p>

# Data Dashboard Application

## Description
This data dashboard application provides dynamic and interactive visualization of various datasets. It utilizes technologies such as D3.js, Crossfilter.js, and DC.js to generate configurable charts that adapt to different types of data.


With this application you can visualize your data in a simple way, just by editing a configuration yml:

```
{
  "data": "data/iris.csv",
  "charts": [
      {
          "title": "Species",
          "type": "categorical",
          "fields": "species"
      },
      {
          "title": "Sepal length",
          "type": "numerical",
          "fields": "sepal_length"
      },
      {
          "title": "Petal length",
          "type": "numerical",
          "fields": "petal_length"
      },
      {
          "title": "Petal width",
          "type": "numerical",
          "fields": "petal_width"
      },
      { 
          "title": "Relation between sepal width, sepal length and petal length",
          "type": "bubble",
          "fields": ["sepal_width", "sepal_length", "petal_length"],
          "maxBubbleSize": 1
      },
      { 
          "title": "Relation between width and length",
          "type": "scatter",
          "fields": ["sepal_width", "sepal_length"],
      }    
  ]
}
```
Previous configuration generates this dashboard, where you can interact with the data. If you click on a bar, the other charts will be filtered by the selected value. If you click on the reset button, the filters will be removed.



![image](https://github.com/javitorres/GenericCross/assets/4235424/e38d0ee4-5af9-4baf-b0fb-7062663b38f5)


## Features
- **Dynamic Configuration**: Charts are dynamically generated based on a JSON configuration, allowing great flexibility.
- **Multiple Chart Types**: Supports various types of charts including bar charts, pie charts, and line charts.
- **Interactivity**: Includes features like filters and the ability to reset each chart individually.
- **Responsive Design**: Charts are organized in a responsive grid layout, adapting to different screen sizes.

## Technologies Used
- D3.js
- Crossfilter.js
- DC.js
- Bulma CSS

## Run

```
node server.js
```

And open this url in your browser:

http://localhost:3000
