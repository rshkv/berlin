//$(document).on("change", ".legend input", () => {
	//console.log("Changed radio");
//});
$(".legend input").click(() => {
	console.log("Changed radio");
});

const width = parseInt(d3.select(".chart").style("width"));
const height = parseInt(d3.select(".chart").style("height"));

const svg = d3.select(".chart")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

const color = d3.scaleSequential(d3.interpolateOrRd);

d3.json("data/berlin.json", (berlin) => {
	
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
		.style("fill", d => color(d.properties["Ausländer"]))
		.attr("d", path)
		.on("click", (d) => {
			console.log(d.properties);
		});
		//.style("fill", "rgb(0,109,44)")
		//.style("fill", d => color(d.properties.populationDensityRankingNorm))
});

