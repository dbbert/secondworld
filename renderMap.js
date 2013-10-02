/*
http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.7296&rep=rep1&type=pdf
Thomas Wang’s 32 bit Mix Function
*/
function hash(key) {
  key += ~(key << 15);
  key ^= (key >> 10);
  key += (key << 3);
  key ^= (key >> 6);
  key += ~(key << 11);
  key ^= (key >> 16);
  return key;
}

onmessage = function (oEvent) {
  var pixelsPerTile = oEvent.data.pixelsPerTile;
  var pixelsPerTileInverted = 1/pixelsPerTile;
  var seed = oEvent.data.seed;
  var zoom = oEvent.data.zoom;
  var coord = oEvent.data.coord;
  
  var octavesWithAmplitudeOne = 3;
  var octaveDepth = 6;

  function calculateLowerOctaves(map) {
    for (var i = 0; i <= zoom; i++) {
      if (i < octavesWithAmplitudeOne) {
        var amplitude = 1;
      } else {
        var amplitude = 1/Math.pow(2,i-octavesWithAmplitudeOne);
        //var amplitude = 1;
      }
      
      totalAmplitude += amplitude;
      
      var octaveMinusZoom = i - zoom;

      // from which 4 points will we interpolate? cornerX and cornerY give the left corner, dist gives the size of the square.
      var octaveDist = 1/Math.pow(2,i);
      var cornerX = Math.floor(coord.x*Math.pow(2,octaveMinusZoom))*octaveDist;
      var cornerY = Math.floor(coord.y*Math.pow(2,octaveMinusZoom))*octaveDist;      
      
      var twoTothirty = Math.pow(2,30); // look into this (does it make the world repeat?)
      var cornerXScaled = cornerX*twoTothirty;
      var cornerYScaled = cornerY*twoTothirty;
      var cornerXdistScaled = (cornerX+octaveDist)*twoTothirty;
      var cornerYdistScaled = (cornerY+octaveDist)*twoTothirty;
      
      var c1 = hash(i^hash(cornerXScaled^hash(cornerYScaled^seed))); //f(0,0)
      var c2 = hash(i^hash(cornerXdistScaled^hash(cornerYScaled^seed))); //f(1,0)
      var c3 = hash(i^hash(cornerXdistScaled^hash(cornerYdistScaled^seed))); //f(1,1)
      var c4 = hash(i^hash(cornerXScaled^hash(cornerYdistScaled^seed))); //f(0,1)
      
      var b1 = c1; //f(0,0)
      var b2 = c2 - c1; //f(1,0) - f(0,0)
      var b3 = c4 - c1; //f(0,1) - f(0,0)
      var b4 = c1 - c2 - c4 + c3; //f(0,0) - f(1,0) - f(0,1) + f(1,1)
      
      //var interpolator = new Interpolator(tileCoordX,tileCoordY,i,zoom);
      
      var twoOctaveMinusZoom = Math.pow(2,octaveMinusZoom);      
      var scaling = amplitude / 2147484;
      
      for(var y = 0; y < pixelsPerTile; y++) {
        for(var x = 0; x < pixelsPerTile; x++) {
          //map[x][y] += interpolator.getValue(coord.x+x/pixelsPerTile,coord.y+y/pixelsPerTile) * amplitude;
          
          var fooX = (coord.x+x*pixelsPerTileInverted)*twoOctaveMinusZoom;
          var fooY = (coord.y+y*pixelsPerTileInverted)*twoOctaveMinusZoom;
          
          var f = fooX - Math.floor(fooX);
          var g = fooY - Math.floor(fooY);

          //map[x][y] += (b1 + b2*f + b3*g + b4*f*g) * scaling;
          //return value/2147483648*1000; // scale it back to something between 0 and 1000
          //return (value >> 23);
          var index = (y * pixelsPerTile) + x;
          map[index] += (b1 + b2*f + b3*g + b4*f*g) * scaling;
        }
      }
    }
    return map;
  }

  function calculateHigherOctaves(map) {
    for (var i = zoom + 1; i <= zoom + 1 + octaveDepth; i++) {
      if (i < octavesWithAmplitudeOne) {
        var amplitude = 1;
      } else {
        var amplitude = 1/Math.pow(2,i-octavesWithAmplitudeOne);
        //var amplitude = 1;
      }
      
      totalAmplitude += amplitude;
      var numberOfSubtiles = Math.pow(2,i-zoom);
      var pixelsPerSubtile = pixelsPerTile/numberOfSubtiles;
      var pixelsPerSubtileInverted = 1/pixelsPerSubtile;
      
      var scaling = amplitude / 2147484;
      
      for(var subtileX = 0; subtileX < numberOfSubtiles; subtileX++) {
        for(var subtileY = 0; subtileY < numberOfSubtiles; subtileY++) {
        
          //var interpolator = new Interpolator(tileCoordX+subtileX/Math.pow(2,i),tileCoordY+subtileY/Math.pow(2,i),i,i);
          //////////////////////  
          // from which 4 points will we interpolate? cornerX and cornerY give the left corner, dist gives the size of the square.
          var octaveDist = 1/Math.pow(2,i);
          var cornerX = Math.floor(coord.x*Math.pow(2,i-zoom)+subtileX)*octaveDist;
          var cornerY = Math.floor(coord.y*Math.pow(2,i-zoom)+subtileY)*octaveDist;
          
          var twoTothirty = Math.pow(2,30);
          var cornerXScaled = cornerX*twoTothirty;
          var cornerYScaled = cornerY*twoTothirty;
          var cornerXdistScaled = (cornerX+octaveDist)*twoTothirty;
          var cornerYdistScaled = (cornerY+octaveDist)*twoTothirty;
          
          var c1 = hash(i^hash(cornerXScaled^hash(cornerYScaled^seed))); //f(0,0)
          var c2 = hash(i^hash(cornerXdistScaled^hash(cornerYScaled^seed))); //f(1,0)
          var c3 = hash(i^hash(cornerXdistScaled^hash(cornerYdistScaled^seed))); //f(1,1)
          var c4 = hash(i^hash(cornerXScaled^hash(cornerYdistScaled^seed))); //f(0,1)
          
          var b1 = c1; //f(0,0)
          var b2 = c2 - c1; //f(1,0) - f(0,0)
          var b3 = c4 - c1; //f(0,1) - f(0,0)
          var b4 = c1 - c2 - c4 + c3; //f(0,0) - f(1,0) - f(0,1) + f(1,1)

          /////////////////////////////////
          
          var offsetX = subtileX*pixelsPerSubtile;
          var offsetY = subtileY*pixelsPerSubtile;
          
          var coordX = coord.x*numberOfSubtiles+subtileX;
          var coordY = coord.y*numberOfSubtiles+subtileY;
          
          for(var y = 0; y < pixelsPerSubtile; y++) {
            for(var x = 0; x < pixelsPerSubtile; x++) {              
              
              var fooX = coordX+x*pixelsPerSubtileInverted;
              var fooY = coordY+y*pixelsPerSubtileInverted;
              
              var f = fooX - Math.floor(fooX);
              var g = fooY - Math.floor(fooY);
                           
              //map[offsetX + x][offsetY + y] += interpolator.getValue(coordX+x/pixelsPerSubtile,coordY+y/pixelsPerSubtile) * amplitude;
              //map[offsetX + x][offsetY + y] += (b1 + b2*f + b3*g + b4*f*g) * scaling;
              var index = ((offsetY + y) * pixelsPerTile) + (offsetX + x);
              map[index] += (b1 + b2*f + b3*g + b4*f*g) * scaling;
            }
          }
        }
      }
    }
    return map;
  }
  
  // initialize the map to zero
  /*var map = new Array(pixelsPerTile);
  for (var i = 0; i < pixelsPerTile; i++) {
    map[i] = new Array(pixelsPerTile);
    for (var j = 0; j < pixelsPerTile; j++) {
     map[i][j] = 0;
    }
  }*/
  
  var totalAmplitude = 0;
  
  var mapBuf = new ArrayBuffer(pixelsPerTile*pixelsPerTile*4);
  var map = new Float32Array(mapBuf);
  
  map = calculateLowerOctaves(map); //calculate influence of octaves with period larger than or equal to tile size  
  map = calculateHigherOctaves(map); // calculate influence of octaves with period smaller than tile size
  
  //var coloredMap = new Array(pixelsPerTile*pixelsPerTile*4);
  var buf = new ArrayBuffer(pixelsPerTile*pixelsPerTile*4);
  var buf8 = new Uint8ClampedArray(buf);
  
  // Draw the map to the canvas and add coloring.
  for(var y = 0; y < pixelsPerTile; y++) {
    for(var x = 0; x < pixelsPerTile; x++) {
      var index = (y * pixelsPerTile) + x;
      //var height = map[x][y]/totalAmplitude;
      var height = map[index]/totalAmplitude;
      var greyValue = Math.round(height/4);
      var index4 = index*4;
      var color1, color2, color3;
      
      if (height < 510) {
          color1 = 0; color2 = 0; color3 = 128;
      } else if (height < 550) {
          color1 = 189; color2 = 183; color3 = 107;
      } else if (height < 620) {
          color1 = 34; color2 = 139; color3 = 34;
      } else if (height < 700) {
          color1 = 5; color2 = 87; color3 = 5;
      } else if (height < 770) {
          color1 = 150; color2 = 150; color3 = 150;
      } else if (height < 800) {
          color1 = 200; color2 = 200; color3 = 200;
      } else {
          color1 = 100; color2 = 100; color3 = 100;
      }
          
      buf8[index4] = color1;
      buf8[++index4] = color2;
      buf8[++index4] = color3;
      buf8[++index4] = 255;
    }
  }
  
  //throw JSON.stringify({data:coloredMap});

  postMessage({coord: coord, buf: buf}, [buf]);
  self.close();
};
