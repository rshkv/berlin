class Heatmap {

	constructor(selection) {
		this.selection = selection;

		this.color = d3.scaleSequential(d3.interpolateOrRd);
		this.accessors = {
			Frauen: "Frauen",
			Männer: "Männer"
		}
	}

	render() {
		this.selection.each((data, i, selection) => {
			const svg = d3.select(selection[0]);
			const width = svg.attr("width");
			const height = svg.attr("height");

			const projection = d3.geoMercator()
				.fitExtent([[0, 0],[width, height]], data);
			this.path = d3.geoPath(projection);


			svg.selectAll("path")
				.data(data.features)
				.enter()
				.append("path")
				.style("fill", this.fillAccessor)
				.attr("d", this.path)
				.on("click", (d) => {
					console.log(d.properties);
				});
		});
	}

	update() {
		this.selection.each((data, i, selection) => {
			const svg = d3.select(selection[i]);

			svg.selectAll("path")
				.data(data.features)
				.style("fill", this.fillAccessor)
				.attr("d", this.path);
		});
	}

	setProperty(property) {
		const path = property;
		this.fillAccessor = d => {
			//console.log(d.properties);
			//console.log(path);
			return this.color(_.get(d.properties, path))
		};
		return this;
	}
}
