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
  "esri/widgets/Legend",
  "esri/widgets/LayerList",
  "esri/widgets/Popup",
  "esri/widgets/Home",
  "esri/widgets/Expand",


], function(esriConfig, Map, MapView,  Editor, FeatureLayer, Locate, Track, Graphic, ScaleBar, Legend, LayerList, Popup, Home, Expand) {
  
  esriConfig.apiKey = "AAPK35c3cea541ad4ccdb1035491acc22167FgsnnV26-T_vShkm4lJa8bBr8t-aBr3Z4T91xJjV9rIb1Slt7rYsx5xxIXOxc27v";

  var popupPoi = {
    "title": "Scenic Overlook",
    "content": "<b>Trail Name:</b> {Trail_Name} <br> <b>Difficulty of Trail:</b> {Difficulty} <br> <b>Comments:</b> {Comments}<br> <b>Date Reached:</b> {Date_Reached}",
  }
  
  var popupSprings = {
    "title": "Spring",
    "content": "<b>Name:</b> {NAME1_}"
  }
  
  var popupMines = {
    "title": "Mine",
    "content": "<b>Name:</b> {NAM} <br> <b>Location:</b> {MAP}"
  }
  
  var popupTrail = {
    "title": "Trail",
    "content": "<b> Name:</b> {TRLNAME} <br> <b> Trail Type: </b> {TRLFEATTYP} <br> <b>Trail Use:</b> {TRLUSE} <br> <b>Trail Class:</b> {TRLCLASS}"
  }

  var popupVisitorCenters = {
    "title": "Visitor Center"
  }
  
  
  const poi = new FeatureLayer({
      url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Big_Bend_Scenic_Overlook/FeatureServer/0",
      popupTemplate: popupPoi
  });

  const springs = new FeatureLayer({
      url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Big_Bend_Springs/FeatureServer/0",
      popupTemplate: popupSprings
  });
  
  const mines = new FeatureLayer({
      url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Big_Bend_Mines/FeatureServer/0",
      popupTemplate: popupMines
  });
  
  const trails = new FeatureLayer({
      url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Big_Bend_Trails/FeatureServer/0",
      popupTemplate: popupTrail
  });
  

  const boundary = new FeatureLayer({
      url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Big_Bend_Boundary/FeatureServer/0"
  });

  const visitorCenters = new FeatureLayer({
    url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Big_Bend_Visitor_Centers/FeatureServer/0",
    popupTemplate: popupVisitorCenters
  });

  const map = new Map({
    basemap: "arcgis-topographic",
    layers: [boundary, trails, visitorCenters, springs, mines, poi]
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-103.3002,29.3002],
    zoom: 10
  });


  // Editor widget
  const editor = new Editor({
    view: view
  });
  // Add widget to the view
  

  const editorExpand = new Expand({
  expandIconClass: "esri-icon-edit",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
  view: view,
  content: editor
  });
  view.ui.add(editorExpand, "top-right");
  
  const homeWidget = new Home({
    view: view
  });

  view.ui.add(homeWidget, "top-left");

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

    const locateWidget = new Locate({
      view: view,   // Attaches the Locate button to the view
      graphic: new Graphic({
        symbol: { type: "simple-marker" }  // overwrites the default symbol used for the
        // graphic placed at the location of the user when found
      })
    });
    
    view.ui.add(locateWidget, "top-left");

     
  const scalebar = new ScaleBar({
    view: view
  });


  const layerList = new LayerList({
    view: view,
    listItemCreatedFunction: function (event) {
      const item = event.item;
      if (item.layer.type != "group"){ // don't show legend twice
        item.panel = {
          content: "legend",
          open: true,
        };
      }
    }
  });

  const layerListExpand = new Expand({
    expandIconClass: "esri-icon-layer-list",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
    view: view,
    content: layerList
  });
  


  view.ui.add(layerListExpand, "top-left");

  view.ui.add(scalebar, "bottom-right");





  // SQL query array
  const trldevLayerSQL = ["Trail Development:", "TRL_Class = 'Class 1: Minimally Developed'", "TRL_Class = 'Class 2: Moderately Developed'", "TRL_Class = 'Class 3: Developed'", "TRL_Class = 'Class 5: Fully Developed'"];
  let whereClause = trldevLayerSQL[0];

  // Add SQL UI
  const select = document.createElement("select","");
  select.setAttribute("class", "esri-widget esri-select");
  select.setAttribute("style", "width: 200px; font-family: 'Avenir Next'; font-size: 1em");
  trldevLayerSQL.forEach(function(query){
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
const trldevLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/xgzmh5yzk7BbOO7S/arcgis/rest/services/Trail_Grid/FeatureServer/0",
  });

  function queryFeatureLayer(extent) {

    const trldevQuery = {
     where: whereClause,  // Set by select element
     spatialRelationship: "intersects", // Relationship operation to apply
     geometry: extent, // Restricted to visible extent of the map
     outFields: ["TRL_Class"], // Attributes to return
     returnGeometry: true
    };

    trldevLayer.queryFeatures(trldevQuery)

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
      color: [ 0, 255, 0, 0.5 ],
      outline: {
        color: "white",
        width: .5
      },
    };

    const popupTRLDEV = {
      title: "Trail Development in This Area",
      content: "<b>Class:</b> {TRL_Class}"
    };

    // Assign styles and popup to features
    results.features.map((feature) => {
      feature.symbol = symbol;
      feature.popupTemplate = popupTRLDEV;
      return feature;
    });

    // Clear display
    view.popup.close();
    view.graphics.removeAll();
    // Add features to graphics layer
    view.graphics.addMany(results.features);
  }





});