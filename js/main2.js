require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Editor",
  "esri/layers/FeatureLayer",
  "esri/widgets/Locate",
  "esri/widgets/Track",
  "esri/Graphic",
  "esri/widgets/ScaleBar",

], function(esriConfig,Map, MapView,  Editor, FeatureLayer, Locate, Track, Graphic, ScaleBar) {
  
  esriConfig.apiKey = "AAPKc7fea78529704909bae7499f1cce72601WvowNcJa7n_SaZth0nGTlKLSPQJwAp2Zzpg27MlnNJjjN2flOPNymBK6brMvI19";

  var popupPoi = {
    "title": "Research Point",
    "content": "<b>Fire Name:</b> {Fire} <br> <b>Flora Damage:</b> {Flora_Damage} <br> <b>Geology:</b> {Geology} <br> <b>Comments:</b> {Comments}"
  }
  
  var popupParking = {
    "title": "Parking",
    "content": "<b>Name:</b> {Name}"
  }
  
  var popupOverlooks = {
    "title": "Overlooks",
    "content": "<b>Name:</b> {POINAME}"
  }
  
  var popupTrail = {
    "title": "Trail",
    "content": "<b> Name:</b> {TRLNAME} <br> <b> Trail Type: </b> {TRLFEATTYP} <br> <b>Trail Use:</b> {TRLUSE}"
  }

  var popupRestrooms = {
    "title": "Restrooms",
    "content": "<b>Name:</b> {NAME}"
  }
  
  const poi = new FeatureLayer({
      url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/ZionNP_kfeffer_geog777_project2/FeatureServer/5",
      popupTemplate: popupPoi
  });

  const parking = new FeatureLayer({
      url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/ZionNP_kfeffer_geog777_project2/FeatureServer/1",
      popupTemplate: popupParking
  });
  
  const overlooks = new FeatureLayer({
      url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/ZionNP_kfeffer_geog777_project2/FeatureServer/0",
      popupTemplate: popupOverlooks
  });
  
  const trail = new FeatureLayer({
      url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/ZionNP_kfeffer_geog777_project2/FeatureServer/3",
      popupTemplate: popupTrail
  });
  
  const restrooms = new FeatureLayer({
      url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/ZionNP_kfeffer_geog777_project2/FeatureServer/2",
      popupTemplate: popupRestrooms
  });

  const boundries = new FeatureLayer({
      url: "https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2"
  });

  
  const map = new Map({
    basemap: "arcgis-topographic", //Basemap layer service
    layers: [boundries, trail, restrooms, parking, overlooks, poi ]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-113.0263,37.2982], //Longitude, latitude
    zoom: 11
  });
  
  // Editor widget
  const editor = new Editor({
    view: view
  });
  // Add widget to the view
  view.ui.add(editor, "top-right");

  // SQL query array
  const fireLayerSQL = ["Choose a SQL where clause...", "YEAR > 2015",  "YEAR > 2010", "YEAR > 2005", "YEAR > 2000", "YEAR > 2000", "YEAR > 1990", "YEAR > 1980", "YEAR > 1970", "FIRE_TYPE = 'Perscribed Fire'", "FIRE_TYPE = 'Wildfire'", "FIRE_TYPE = 'Unknown'"];
  let whereClause = fireLayerSQL[0];

  // Add SQL UI
  const select = document.createElement("select","");
  select.setAttribute("class", "esri-widget esri-select");
  select.setAttribute("style", "width: 200px; font-family: 'Avenir Next'; font-size: 1em");
  fireLayerSQL.forEach(function(query){
    let option = document.createElement("option");
    option.innerHTML = query;
    option.value = query;
    select.appendChild(option);
  });

  view.ui.add(select, "top-right");

   // Listen for changes
  select.addEventListener('change', (event) => {
    whereClause = event.target.value;

    queryFeatureLayer(view.extent);

  });

// Get query layer and set up query
const fireLayer = new FeatureLayer({
    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/ZionNP_kfeffer_geog777_project2/FeatureServer/4",
  });

  function queryFeatureLayer(extent) {

    const fireQuery = {
     where: whereClause,  // Set by select element
     spatialRelationship: "intersects", // Relationship operation to apply
     geometry: extent, // Restricted to visible extent of the map
     outFields: ["FIRE_ID","FIRE_NAME","YEAR","STARTMONTH", "STARTDAY", "FIRE_TYPE", "COMMENTS"], // Attributes to return
     returnGeometry: true
    };

    fireLayer.queryFeatures(fireQuery)

    .then((results) => {

      console.log("Feature count: " + results.features.length)

      displayResults(results);

    }).catch((error) => {
      console.log(error.error);
    });

  }

  function displayResults(results) {
    // Create a blue polygon
    const symbol = {
      type: "simple-fill",
      color: [ 20, 130, 200, 0.5 ],
      outline: {
        color: "white",
        width: .5
      },
    };

    const popupFires = {
      title: "Fire",
      content: "<b>Name:</b> {FIRE_NAME} <br> <b>ID:</b> {FIRE_ID} <br> <b>Type:</b> {FIRE_TYPE} <br> <b>Year:</b> {YEAR} <br> <b>Start Month:</b> {STARTMONTH} <br> <b>Start Day:</b> {STARTDAY} <br> <b>Comments:</b> {COMMENTS}"
    };

    // Assign styles and popup to features
    results.features.map((feature) => {
      feature.symbol = symbol;
      feature.popupTemplate = popupFires;
      return feature;
    });

    // Clear display
    view.popup.close();
    view.graphics.removeAll();
    // Add features to graphics layer
    view.graphics.addMany(results.features);
  }
  
  const track = new Track({
      view: view,
      graphic: new Graphic({
        symbol: {
          type: "simple-marker",
          size: "12px",
          color: "green",
          outline: {
            color: "#efefef",
            width: "1.5px"
          }
        }
      }),
      useHeadingEnabled: false
    });
    view.ui.add(track, "top-left");
     
  const scalebar = new ScaleBar({
    view: view
  });

  view.ui.add(scalebar, "bottom-left"); 

}); 