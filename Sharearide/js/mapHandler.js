// Initialiser la carte
var map = L.map('map').setView([50.8503, 4.3517], 10); // Bruxelles par défaut

// Ajouter les tuiles OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var markerStart = null;
var markerEnd = null;

var latChoosed = null;
var lngChoosed = null;
var cityFound = null;
var countryFound = null;

let routingControl = null;

// Gérer le clic sur la carte
map.on('click', function(e) {
latChoosed = e.latlng.lat;
lngChoosed = e.latlng.lng;

// Nominatim pour récupérer l'adresse
fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latChoosed}&lon=${lngChoosed}&format=json`)
    .then(response => response.json())
        .then(data => {
            var address = data.address || "Adresse inconnue";

            var houseNumber = address.house_number || '';
            var road = address.road || '';
            var postcode = address.postcode || '';
            var city = address.city || address.village || address.town || '';
            var country = address.country || '';

            countryFound = country;
            cityFound = city;

            var info = `Ville : ${city}<br> Code Postal : ${postcode}<br> Pays : ${country}`.trim();

            // marker = L.marker([lat, lng]).addTo(map)
            // .bindTooltip(info, { permanent: true, direction: 'top' })
            // .openTooltip();

            $('#modalChooseStartEnd').modal('show');
            $('#place-selected').html(info);
        }
    );
});

const inputStart = document.getElementById('lc');
const suggestionsStart = document.getElementById('suggestionsStart');

const inputEnd = document.getElementById('arrive');
const suggestionsEnd = document.getElementById('suggestionsEnd');

let debounceTimer;

$(document).keyup(function(event) {
    if ($("#lc").is(":focus") && event.key == "Enter") {
        var first_li = $('ul#suggestionsStart li:first');
        if(first_li){
            first_li.trigger("click");
        }
        else{
            
        }
    }

    if ($("#arrive").is(":focus") && event.key == "Enter") {
        var first_li = $('ul#suggestionsEnd li:first');
        if(first_li){
            first_li.trigger("click");
        }
        else{
            
        }
    }
});

function findAndValidateSuggestion(inp, sug, markerType, word)
{
    clearTimeout(debounceTimer);
    const query = inp.value.trim();

    if (query.length < 2) {
      sug.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=be&limit=5`)
        .then(res => res.json())
        .then(data => {
          sug.innerHTML = '';
          data.forEach(place => {

            const queryLower = query.toLowerCase();
            const address = place.address;

            if (
                (address.city && address.city.toLowerCase().includes(queryLower)) ||
                (address.town && address.town.toLowerCase().includes(queryLower)) ||
                (address.village && address.village.toLowerCase().includes(queryLower)) ||
                (address.municipality && address.municipality.toLowerCase().includes(queryLower)) ||
                (address.hamlet && address.hamlet.toLowerCase().includes(queryLower)) ||
                (address.locality && address.locality.toLowerCase().includes(queryLower))
            ) {

              if (routingControl) {
                map.removeControl(routingControl);
              }

              const li = document.createElement('li');
              li.classList.add("list-group-item");
              li.classList.add("list-group-item-action");
              li.textContent = `${address.city || address.town || address.village || address.municipality || "N/A"}, ${address.country}`.trim();
              li.addEventListener('click', () => {
                const lat = parseFloat(place.lat);
                const lon = parseFloat(place.lon);
                map.setView([lat, lon], 13);
                sug.innerHTML = '';
                inp.value = li.textContent;
                
                if(markerType === 'markerStart')
                {
                  if(markerStart){
                    markerStart.remove();
                  }

                  markerStart = L.marker([lat, lon]).addTo(map)
                  .bindTooltip(`${word} : ${li.textContent}`, { permanent: true, direction: 'top' })
                  .openTooltip();
                }

                if(markerType === 'markerEnd')
                  {
                    if(markerEnd){
                      markerEnd.remove();
                    }

                    markerEnd = L.marker([lat, lon]).addTo(map)
                    .bindTooltip(`${word} : ${li.textContent}`, { permanent: true, direction: 'top' })
                    .openTooltip();
                }

                goTo();
              });
              sug.appendChild(li);
            }
          });
        });
    }, 300); // délai anti-spam
}

inputStart.addEventListener('input', () => findAndValidateSuggestion(inputStart, suggestionsStart, 'markerStart', "Départ"));

inputEnd.addEventListener('input', () => findAndValidateSuggestion(inputEnd, suggestionsEnd, 'markerEnd', "Arrivée"));

// Fermer les suggestions si on clique ailleurs
document.addEventListener('click', (e) => {
  if (e.target !== inputStart && e.target !== inputEnd) {
      suggestionsStart.innerHTML = '';
      suggestionsEnd.innerHTML = '';
    }
  });

function modifyStart() {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  const lat = parseFloat(latChoosed);
  const lng = parseFloat(lngChoosed);
  map.setView([lat, lng], 13);
  
  var info = `${cityFound}, ${countryFound}`.trim();
  inputStart.value = info;
  
  if(markerStart)
  {
    markerStart.remove();
  }

  markerStart = L.marker([lat, lng]).addTo(map)
  .bindTooltip(`Départ : ${info}`, { permanent: true, direction: 'top' })
  .openTooltip();

  $('#modalChooseStartEnd').modal('hide');

  goTo();
}

function modifyEnd() {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  const lat = parseFloat(latChoosed);
  const lng = parseFloat(lngChoosed);
  map.setView([lat, lng], 13);
  
  var info = `${cityFound}, ${countryFound}`.trim();
  inputEnd.value = info;
  
  if(markerEnd)
  {
    markerEnd.remove();
  }

  markerEnd = L.marker([lat, lng]).addTo(map)
  .bindTooltip(`Arrivée : ${info}`, { permanent: true, direction: 'top' })
  .openTooltip();

  $('#modalChooseStartEnd').modal('hide');

  goTo();
}

function goTo(){
  if (!markerStart || !markerEnd) {
    
    return
  }

  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [
      markerStart.getLatLng(),
      markerEnd.getLatLng()
    ],
    routeWhileDragging: false,
    show: false,
    addWaypoints: false,
    createMarker: function() { return null; }, // Ne recrée pas les marqueurs
    lineOptions: {
      styles: [{ color: 'blue', opacity: 0.7, weight: 5 }]
    }
  }).addTo(map);
}