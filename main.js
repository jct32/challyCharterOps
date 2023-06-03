

function generateGraph(minimumDistance, maximumDistance) {
    var routeDatabase = new Map()

    for (const route in routes) {
        let origin = routes[route]['origin']
        let destination = routes[route]['destination']
        let originAirport = ''
        let destinationAirport = ''
        if (airports[origin] == undefined) {
            if (origin.length == 3) {
                origin = 'K' + origin
                if (airports[origin] == undefined) {
                    continue
                }
                else {
                    originAirport = airports[origin]
                }
            }
            else {
                continue
            }
        }
        else {
            originAirport = airports[origin]
        }
        if (airports[destination] == undefined) {
            if (destination.length == 3) {
                destination = 'K' + destination
                if (airports[destination] == undefined) {
                    continue
                }
                else {
                    destinationAirport = airports[destination]
                }
            }
            else {
                continue
            }
        }
        else {
            destinationAirport = airports[destination]
        }
        let distance = 0;
        try {
            distance = calculateDistance(
                originAirport["latitude"], originAirport["longitude"],
                destinationAirport["latitude"], destinationAirport["longitude"]
            )
        }
        catch {
            console.log('bad')
        }
        
        if (distance < minimumDistance || distance > maximumDistance) {
            continue
        }
        if (!routeDatabase.has(origin)) {
            routeDatabase.set(origin, [destination])
        }
        else {
            routeDatabase.get(origin).push(destination)
        }
    }
    return routeDatabase
}

function calculateDistance(lat1, long1, lat2, long2) {
    if (lat1 == lat2 && long1 == long2) {
        return 0
    } 
    lat1 = degreesToRadians(lat1)
    long1 = degreesToRadians(long1)
    lat2 = degreesToRadians(lat2)
    long2 = degreesToRadians(long2)
    leftOperand = Math.sin(lat1) * Math.sin(lat2)
    rightOperand = Math.cos(lat1) * Math.cos(lat2) * Math.cos(long1-long2)
    distance_rad = Math.acos(leftOperand + rightOperand)
    return 60 * radiansToDegrees(distance_rad)
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI
}

function routeBuilder(graph, start, legs) {
    let paths = [start]
    let attempts = 0
    while(paths.length != legs) {
        if (attempts < 10) {
            if (graph.get(start) == undefined) {
                paths.pop()
                start = paths[paths.length - 1]
                attempts++
                while (graph.get(start).length == 1) {
                    paths.pop()
                    start = paths[paths.length - 1]
                }
                continue
            }
            else {
                let randomNum = Math.floor(Math.random() * graph.get(start).length)
                prev_legs = graph.get(start).length
                start = graph.get(start)[randomNum]
                paths.push(start)
                attempts = 0
            }
        }
        else {
            console.log("Max number of attempts, try again with different selections")
            break
        }
    }
    return paths
}

function getRoute() {
    let startingAirport = document.getElementById('starting-airport').value
    let minDistance = document.getElementById('min-distance').value
    let maxDistance = document.getElementById('max-distance').value
    let legs = document.getElementById('legs').value
    let maxPax = document.getElementById('max-pax').value
    let paragraph = document.getElementById("output-paragraph");
    paragraph.innerHTML = ''

    if (isNaN(Number(minDistance)) || minDistance == '') {
        minDistance = 0
    }
    else {
        minDistance = Number(minDistance)
    }
    if (isNaN(Number(maxDistance)) || maxDistance == '') {
        maxDistance = 5000
    }
    else {
        maxDistance = Number(maxDistance)
    }
    if (isNaN(Number(maxPax)) || maxPax == '') {
        maxPax = 12
        paragraph.innerHTML += 'Max Passengers set to 12 <br>'
    }
    else {
        maxPax = Number(maxPax)
    }

    let routeGraph = generateGraph(minDistance, maxDistance);

    if (routeGraph.get(startingAirport.toUpperCase()) == undefined) {
        let randomNum = Math.floor(Math.random() * routeGraph.size)
        startingAirport = Array.from(routeGraph.keys())[randomNum]
        paragraph.innerHTML += `Failed to get airport randomized to ${startingAirport}<br>`
    }

    if (isNaN(Number(legs)) || legs == '') {
        paragraph.innerHTML += `Legs defaulted to 3<br>`
        legs = 3
    }
    else {
        legs = Number(legs)
    }

    let returnedRoute = routeBuilder(routeGraph, startingAirport, legs + 1)
    let prev_pax = 999
    for (var i = 0; i < returnedRoute.length - 1; i++) {
        var origin = returnedRoute[i];
        var destination = returnedRoute[i+1]
        var button = document.createElement('button')
        var link = document.createElement('a')
        var pax = Math.floor(Math.random() * maxPax)
        if (prev_pax == 0) {
            while (pax == 0) {
                pax = Math.floor(Math.random() * maxPax)
            }
        }
        prev_pax = pax
        var simbriefURL = ['https://dispatch.simbrief.com/options/custom?']
        simbriefURL.push('type=CL60')
        simbriefURL.push(`orig=${origin}`)
        simbriefURL.push(`dest=${destination}`)
        simbriefURL.push(`pax=${pax}`)
        simbriefURL = simbriefURL.join('&')
        link.href = simbriefURL
        button.innerText = 'Simbrief'
        link.appendChild(button)
        link.target = '_blank'

        paragraph.innerHTML += `<br> ${origin} - ${destination}    `
        paragraph.appendChild(link)
    }
}

airports = null;
routes = null;

btn = document.getElementById('generate-btn')
btn.addEventListener("click", getRoute)
fetch('https://raw.githubusercontent.com/jct32/jsonstuff/main/airports.json')
        .then(response => response.json())
        .then(json => {
            airports = json;
        })
        .catch(error => console.error('Error:', error));
fetch('https://raw.githubusercontent.com/jct32/jsonstuff/main/routes.json')
        .then(response => response.json())
        .then(json => {
            routes = json;
        })
        .catch(error => console.error('Error:', error));