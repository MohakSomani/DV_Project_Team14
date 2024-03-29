
function updateYear() {
  const yearSlider = document.getElementById("yearSlider");
  const year = yearSlider.value;
  const years = ['1962', '1967', '1971', '1977', '1980', '1984', '1989', '1991', '1996', '1998', '2004', '2009', '2014', '2019'];
  var closest = years.reduce(function (prev, curr) {
    return (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev);
  });
  document.getElementById("selectedYear").innerText = closest;
}

function getData() {
  const year = document.getElementById("yearSlider").value;
  const years = ['1962', '1967', '1971', '1977', '1980', '1984', '1989', '1991', '1996', '1998', '2004', '2009', '2014', '2019'];
  var closest = years.reduce(function (prev, curr) {
    return (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev);
  });
  d3.json("data.json").then(function(rawData){
    drawchart(rawData , closest);
  });
}

updateYear();
getData();

async function drawchart(rawData , closest){
  
  const data = rawData.filter(d => d.year == closest);
  
  const parties = Array.from(new Set(data.map(d => d.party)));
  const states = Array.from(new Set(data.map(d => d.state)));
  
  const processedData = states.map(state => {
      const entry = {state};
      data.filter(d => d.state === state).forEach(d => {
        entry[d.party] = d.constituencies_count;
      });
      return entry;
    });

    const stack = d3.stack()
    .keys(parties)
    .value((d, key) => d[key] || 0);
    
    const series = stack(processedData);
    
    const width = 2000;
    const height = 1500;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const outerRadius = Math.min(innerWidth-100, innerHeight-100) / 2 - 10;
    const innerRadius = 200;
    
    
    const arc = d3.arc()
    .innerRadius(d => y(d[0]))
    .outerRadius(d => y(d[1]))
    .startAngle(d => x(d.data.state))
    .endAngle(d => x(d.data.state) + x.bandwidth())
    .padAngle(0.005)
    .padRadius(innerRadius);
    
    
    const x = d3.scaleBand()
    .domain(states)
    .range([0, 2 * Math.PI])
    .align(0);
    
    const y = d3.scaleRadial()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
    .range([innerRadius, outerRadius]);
    
    const color = d3.scaleOrdinal()
    .domain(parties)
    .range(d3.schemeCategory10);
    
    d3.select("svg").remove();

    const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    // .attr("style", "width: 100%; height: auto; font: 10px sans-serif;")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);
    
    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
    
    svg.append("g")
    .selectAll()
    .data(series)
    .join("g")
    .attr("fill", d => color(d.key))
    .selectAll("path")
    .data(d=> d)
        .join("path")
        .attr("d", arc)
        .on("mouseover", function(event, d) {
            d3.select(this)
            .style("stroke", "cyan")
            .style("stroke-width", 2);
            
            const state = d.data.state;
            const party = d3.select(this.parentNode).datum().key;
            const seats = d.data[party] || "N/A";
            
            tooltip.style("opacity", 1)
            .html(`State: ${state}<br>Party: ${party || "N/A"}<br>Seats: ${seats}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
            // })
          })
          .on("mouseout", function () {
            d3.select(this).style("stroke", "#fff").style("stroke-width", 0.5);
            tooltip.style("opacity", 0);
          });
        
          console.log("Hemang")
          
          const totalConstituencyCount = {};
          data.forEach(d => {
            if (!totalConstituencyCount[d.state]) {
              totalConstituencyCount[d.state] = 0;
            }
            totalConstituencyCount[d.state] += d.constituencies_count || 0;
          });
          
          
          svg.append("g")
          .selectAll()
          .data(x.domain())
          
          .join("g")
          .call(g =>g
            .attr("text-anchor", function (d) { return (x(d) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
        .attr("transform", function (d) { return "rotate(" + ((x(d) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + ( y(totalConstituencyCount[d]) + 10) + ",0)" })
        .append("text")
        .text(function (d) { return  d})
            .attr("transform", function (d) { return (x(d) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
            .style("font-size", "15px").style("fill", "black")
            .attr("alignment-baseline", "middle")
            );
            
            svg.append("g")
            .attr("text-anchor", "end")
            .call(g => g.selectAll("g")
            .data(y.ticks(10).slice(1))
            .join("g")
            .attr("fill", "none")
            .call(g => g.append("circle")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.5)
            .attr("r", y))
            .call(g => g.append("text")
            .attr("x", -6)
            .attr("y", d => -y(d))
            .attr("dy", "0.35em")
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text(y.tickFormat(10, "s"))
            .clone(true)
            .attr("fill", "#000")
            .attr("stroke", "none")));
            
            svg.append("g")
            .attr("transform", `translate(600,20)`) 
            .selectAll()
            .data(color.domain())
            .join("g")
            .attr("transform", (d, i, nodes) => `translate(0, ${(nodes.length / 2 - i - 1) * 20})`)
            .call(g => g.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", color))
            .call(g => g.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(d => d));

    
            
            return svg.node();
          };