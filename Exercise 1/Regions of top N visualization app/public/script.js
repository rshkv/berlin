const width = 1000;
const height = 600;

const svg = d3.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

d3.json("maps/Berlin-Ortsteile.geojson", (berlin) => {
	//console.log(data);
	//const berlin = topojson.feature(data,	data.objects['Berlin-Ortsteile']);
	console.log(berlin);

	const projection = d3.geoMercator()
		.fitExtent([[0, 0], [width, height]], berlin);

	let path = d3.geoPath(projection);

	//const color = d3.scaleQuantize()
		//.domain([0, 1])
		//.range(["#70B5DC", "#0075B4"]);

	svg.selectAll("path")
		.data(berlin.features)
		.enter()
		.append("path")
		.attr("d", path)
		.on("click", (d) => {
			console.log(d.properties.Name);
		});
		//.style("fill", "rgb(0,109,44)")
		//.style("fill", d => color(d.properties.populationDensityRankingNorm))
});

