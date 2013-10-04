// parameters
var pixelsPerTile = 128; // size of a tile in pixels
var seed = 2;            // seed for the hash function; this determines the world.
var minZoom = 0;
var maxZoom = 15;

function CoordMapType() {
}

CoordMapType.prototype.tileSize = new google.maps.Size(pixelsPerTile,pixelsPerTile);
CoordMapType.prototype.minZoom = minZoom;
CoordMapType.prototype.maxZoom = maxZoom;

/*
  getTile(tileCoord:Point, zoom:number, ownerDocument:Document)
  Returns a tile for the given tile coordinate (x, y) and zoom level. This tile will be appended to the given ownerDocument.
*/
CoordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {

  // create a canvas element in the DOM and set its params. 
  var canvas = ownerDocument.createElement('canvas');
  canvas.setAttribute('width', pixelsPerTile);
  canvas.setAttribute('height', pixelsPerTile);
  
  var context = canvas.getContext('2d');
  var imageData = context.getImageData(0, 0, pixelsPerTile, pixelsPerTile);
  
  // Create a new web worker to render this tile of the map (this will happen asynchronously in another thread)
  this.worker = new Worker('worker.js');
  this.worker.onmessage = function (oEvent) {
    if (oEvent.data.coord.x == coord.x && oEvent.data.coord.y == coord.y) {
      imageData.data.set(new Uint8ClampedArray(oEvent.data.buf));
      context.putImageData(imageData, 0, 0);
    }
  };
  this.worker.postMessage({zoom: zoom, coord: coord, pixelsPerTile: pixelsPerTile, seed: seed});
  
  return canvas;
};

/*
  releaseTile(tile:Node)
  Releases the given tile, performing any necessary cleanup. The provided tile will have already been removed from the document.
*/
CoordMapType.prototype.releaseTile = function (tile) {
  // terminate the worker, even if it's not finished yet (e.g. while zooming in fast)
  //this.worker.terminate();
}

var map;
var chicago = new google.maps.LatLng(41.850033,-87.6500523);
var coordinateMapType = new CoordMapType();

function initialize() {
  var mapOptions = {
    zoom: 0,
    //zoomControl: false,
    mapTypeControl: false,
    center: chicago,
    streetViewControl: false,
    mapTypeId: 'coordinate',
    mapTypeControlOptions: {
      mapTypeIds: ['coordinate', google.maps.MapTypeId.ROADMAP],
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    }
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  google.maps.event.addListener(map, 'maptypeid_changed', function() {
    var showStreetViewControl = map.getMapTypeId() != 'coordinate';
    map.setOptions({'streetViewControl': showStreetViewControl});
  });

  // Now attach the coordinate map type to the map's registry
  map.mapTypes.set('coordinate', coordinateMapType);
}

google.maps.event.addDomListener(window, 'load', initialize);
