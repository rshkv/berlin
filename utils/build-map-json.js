var hdb        = require('hdb');
var fs         = require("fs");
var Q          = require('q');

var jsonFile = 'berlin.geojson'
var parsedJsonFile = null;
var populationDensityRanking = 'SELECT zipmap."Bezirk" AS BEZIRK, COUNT(ps.ID) AS INHABITANTS, AVG(YEAR(CURRENT_DATE) - YEAR(BIRTH_DATE)) AS AVGAGE, SUM(WEIGHT) AS SUMWEIGHT, AVG(WEIGHT) AS AVGWEIGHT, SUM(HEIGHT) AS SUMHEIGHT, AVG(HEIGHT) AS AVGHEIGHT FROM "TUK"."PERSONS_S" ps JOIN "TUKGRP2"."PLZ_BEZIRK_MAPPING" zipmap ON ps.ZIP = zipmap.PLZ GROUP BY zipmap."Bezirk"';

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

function enrichJson(queryResults) {
  var bezirkMapping = {};

  // iterate over query results
  for (var result in queryResults) {
    bezirkMapping[queryResults[result].BEZIRK] = {
      'inhabitants': queryResults[result].INHABITANTS,
      'age_average': queryResults[result].AVGAGE,
      'age_sum': queryResults[result].SUMAGE,
      'weight_average': queryResults[result].AVGWEIGHT,
      'weight_sum': queryResults[result].SUMWEIGHT,
      'height_average': queryResults[result].AVGHEIGHT,
      'height_sum': queryResults[result].SUMHEIGHT,
    }
  }
  console.log("Processed bezirk statistics")


  //delete queryResults;

  // iterate over jsonFile
  for (var i = 0, j = parsedJsonFile.features.length-1; i < j; ++i) {
    var bzrk = parsedJsonFile.features[i].properties.Bezirk    
    // rewrite the whole properties section
    if (bzrk in bezirkMapping) { 
      console.log('Added HANA data for: ', bzrk);
      parsedJsonFile.features[i].properties['fromhana'] = bezirkMapping[bzrk];
    }
  }
  console.log('Wrote new properties into GEOJSON structure...')

  fs.writeFileSync('berlin-alternative.geojson', JSON.stringify(parsedJsonFile))
  console.log('Wrote new GEOJSON file')
}

Q.all([connectHana(), readRawGeoJson()])
 .then(queryHana)
 .then(enrichJson)
 .then(function() {
   process.exit(0)
 })
