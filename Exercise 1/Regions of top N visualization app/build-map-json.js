var hdb        = require('hdb');
var fs         = require("fs");
var Q          = require('q');

var jsonFile = 'postleitzahlen.geojson'
var parsedJsonFile = null;
var populationDensityRanking = 'SELECT ZIP,INHABITANTS,INHABITANTS_PER_KM2,(INHABITANTS - MIN(INHABITANTS) OVER ())/ (MAX(INHABITANTS) OVER () - MIN(INHABITANTS) OVER ()) AS RANKING_NORMALIZED,NTILE(100) OVER (ORDER BY INHABITANTS DESC) AS RANKING_PERCENTILE	FROM "TUKGRP2"."PLZ_DATA_STBA"';

var hanaClient = hdb.createClient({
  host     : '192.168.30.150',
  port     : 31615,
  user     : 'TUKGRP2',
  password : 'nBgudm4i'
})

hanaClient.on('error', function (err) {
  console.error('Network connection error', err);
})

function connectHana() {
  var deferred = Q.defer();

  hanaClient.connect(function (err) {
    if (err) {
      return deferred.reject()
    } else {
      return deferred.resolve(hanaClient)
    }
  })

  return deferred.promise
}

function readRawGeoJson() {
  var deferred = Q.defer();

  fs.readFile(jsonFile, 'utf8', function (err, data) {
    if (err) {
      return deferred.reject()
    }

    parsedJsonFile = JSON.parse(data);
    deferred.resolve()
  });

  return deferred.promise
}

function queryHana() {
  var deferred = Q.defer()

  // chance to bundle everything in a Q.all for multiple queries
  hanaClient.exec(populationDensityRanking, function(err, rows) {
    if (err) { return deferred.reject()}
    else { return deferred.resolve(rows) }
  })

  return deferred.promise
}

function reformatJson(queryResults) {
  var zipMapping = {};

  // iterate over query results
  for (var result in queryResults) {
    zipMapping[queryResults[result].ZIP] = {
      'zip': zip,
      'population-density-ranking-norm': queryResults[result].RANKING_NORMALIZED,
      'population-density-ranking-perc': queryResults[result].RANKING_PERCENTILE,
      'population-density': queryResults[result].INHABITANTS_PER_KM2,
      'population': queryResults[result].INHABITANTS
    }
  }
  console.log("Processed zip population mapping results")


  //delete queryResults;

  // iterate over jsonFile
  console.log(parsedJsonFile.features.length)
  for (var i = 0, j = parsedJsonFile.features.length-1; i < j; ++i) {
    var zip = parsedJsonFile.features[i].properties.postcode    
    // rewrite the whole properties section
    if (zip in zipMapping) parsedJsonFile.features[i].properties = zipMapping[zip];
  }
  console.log('Wrote new properties into GEOJSON structure...')

  fs.writeFileSync('postleitzahlen-alternative.geojson', JSON.stringify(parsedJsonFile))
  console.log('Wrote new GEOJSON file')
}

Q.all([connectHana(), readRawGeoJson()])
 .then(queryHana)
 .then(reformatJson)
 .then(function() {
   process.exit(0)
 })
