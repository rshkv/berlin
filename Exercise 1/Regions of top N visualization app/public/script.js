const width = 1000;
const height = 600;

const svg = d3.select("body")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

d3.json("data/postleitzahlen.geojson", (data) => {
	const projection = d3.geoMercator()
		.fitExtent([[0, 0], [width, height]], data);

	let path = d3.geoPath(projection);

	const color = d3.scaleQuantize()
		.range(["rgb(237,248,233)", "rgb(186,228,179)","rgb(116,196,118)",
			"rgb(49,163,84)","rgb(0,109,44)"]);

	svg.selectAll("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.style("fill", d => {
			return "steelblue";
		});

});

