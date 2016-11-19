const width = 1000;
const height = 600;

const svg = d3.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

d3.json("deutschland.geojson", function(data) {

	const projection = d3.geoMercator()
		.fitExtent([[0, 0], [width, height]], data); 

	let path = d3.geoPath(projection);

	svg.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path);

});

