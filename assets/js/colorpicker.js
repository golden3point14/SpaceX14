getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

generateDesaturatedColor = function() {
  var origRed = getRandomInt(1,255);
  var origGreen = getRandomInt(1,255);
  var origBlue = getRandomInt(1,255);

  var desturationLevel = 0.7;

  var intensity = (origRed * 0.3) + (origGreen * 0.59) + (origBlue * 0.11);
  var r = (intensity * desturationLevel) + origRed * (1 - desturationLevel);
  var g = (intensity * desturationLevel) + origGreen * (1 - desturationLevel);
  var b = (intensity * desturationLevel) + origBlue * (1 - desturationLevel);
  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);
  return "rgb(" + r + "," + g + "," + b + ")"; 
};

reallyGenerateDesaturatedColor = function() {
  var h = getRandomInt(0,360);
  var s = 0.1;
  var v = 0.7;

  var chroma = s * v;
  var hdash = h / 60.0;
  var x = chroma * (1.0 - Math.abs(hdash % 2.0) - 1.0);
  var r = 0;
  var g = 0;
  var b = 0;

  if (hdash < 1.0)
  {
    r = chroma;
    g = x;
  }
  else if (hdash < 2.0)
  {
    r = x;
    g = chroma;
  }
  else if (hdash < 3.0)
  {
    g = chroma;
    b = x;
  }
  else if (hdash < 4.0)
  {
    g = x;
    b = chroma;
  }
  else if (hdash < 5.0)
  {
    r = x;
    b = chroma;
  }
  else if (hdash < 6.0)
  {
    r = x;
    b = chroma;
  }

  var min = v - chroma;
  r += min;
  g += min;
  b += min;
  r = Math.round(255 * r);
  g = Math.round(255 * g);
  b = Math.round(255 * b);
  return "rgb(" + r + "," + g + "," + b + ")"; 
};

generateRandomColor = function() {
  var r = getRandomInt(1, 255);
  var g = getRandomInt(1, 255);
  var b = getRandomInt(1, 255);

  return "rgb(" + r + "," + g + "," + b + ")"; 
}

