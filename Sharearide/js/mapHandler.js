// Initialiser la carte
var map = L.map('map').setView([50.8503, 4.3517], 10); // Bruxelles par défaut

// Ajouter les tuiles OpenStreetMap, info de la carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; OpenStreetMap contributors' // copyright
}).addTo(map);

var markerStart = null; // Null car attribué à rien du tout pour le moment 
var markerEnd = null;

var latChoosed = null;
var lngChoosed = null;
var cityFound = null;
var countryFound = null;

let routingControl = null;

// Gérer le clic sur la carte
map.on('click', function(e) { // E = informations que tu peux récuperer avec le click 
latChoosed = e.latlng.lat;    // informtaions du click 
lngChoosed = e.latlng.lng;

// Nominatim pour récupérer l'adresse grace à la lat et long
fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latChoosed}&lon=${lngChoosed}&format=json`)
    .then(response => response.json())
        .then(data => {
            var address = data.address || "Adresse inconnue";

            var houseNumber = address.house_number || ''; // Info de l'adresse récupérées
            var road = address.road || '';
            var postcode = address.postcode || '';
            var city = address.city || address.village || address.town || '';
            var country = address.country || '';

            countryFound = country; // attribus pris en compte pour utilisations futures
            cityFound = city;

            var info = ` Rue : ${road} ${houseNumber} <br> Ville : ${city}<br> Code Postal : ${postcode}<br> Pays : ${country}`.trim(); // Ce qui s'affiche quand le pop up apparaît <br> pour mettre à la ligne

            // marker = L.marker([lat, lng]).addTo(map)
            // .bindTooltip(info, { permanent: true, direction: 'top' })
            // .openTooltip();

            $('#modalChooseStartEnd').modal('show'); // Toujours lié à l'événement click
            $('#place-selected').html(info); // pour modfifier directement le code html
        }
    );
});

const inputStart = document.getElementById('lc'); // Quand on commence à écrire dans la barre d'arrive ça suggère des adresses
const suggestionsStart = document.getElementById('suggestionsStart');

const inputEnd = document.getElementById('arrive');
const suggestionsEnd = document.getElementById('suggestionsEnd');

let debounceTimer; // Timer pour évite de spam l'api (la carte), ça évite de suggérer des adresses constamment 

$(document).keyup(function(event) { // Si on appuie sur entrer ça prend la permière suggestion qui apparait et ça simule un click dessus
    if ($("#lc").is(":focus") && event.key == "Enter") { // clé qui enclenche l'événement "enter"
        var first_li = $('ul#suggestionsStart li:first');
        if(first_li){
            first_li.trigger("click");
        }
        else{
            
        }
    }

    if ($("#arrive").is(":focus") && event.key == "Enter") { // Si on appuie sur entrer ça prend la permière suggestion qui apparait et ça simule un click dessus
        var first_li = $('ul#suggestionsEnd li:first');
        if(first_li){
            first_li.trigger("click");
        }
        else{
            
        }
    }
});

function findAndValidateSuggestion(inp, sug, markerType, word) // Prend un input, une suggestion, un marqueur type (start ou end), word le petit mot posé sur le marqueur (départ)
{
    clearTimeout(debounceTimer);
    const query = inp.value.trim();

    if (query.length < 2) { // Si ta suggestion fait pas assez de caractères elle ne suggère rien, toujours dans la recherche
      sug.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(() => { // Ce qui permet de pas refaire la fonction temps que ce n'est pas fini
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&countrycodes=be&limit=5`) // retrouver la ville en fonction d'une chaine de caractères 
        .then(res => res.json())
        .then(data => {
          sug.innerHTML = '';
          data.forEach(place => { // Pour tout ce qu'il va trouver mets tout en minuscule, prend l'adresse 

            const queryLower = query.toLowerCase();
            const address = place.address;

            if ( // Si tu as bien une adresse point city et que l'adresse tout en minuscule correspond à quelquechose qui existe permets de continuer la fonction
                (address.city && address.city.toLowerCase().includes(queryLower)) ||
                (address.town && address.town.toLowerCase().includes(queryLower)) ||
                (address.village && address.village.toLowerCase().includes(queryLower)) ||
                (address.municipality && address.municipality.toLowerCase().includes(queryLower)) ||
                (address.hamlet && address.hamlet.toLowerCase().includes(queryLower)) ||
                (address.locality && address.locality.toLowerCase().includes(queryLower))
            ) {

             
              const li = document.createElement('li'); // élement d'une liste pas encore display 
              li.classList.add("list-group-item"); // Class de boostrap sympa graphiquement, 
              li.classList.add("list-group-item-action");
              li.textContent = `${address.city || address.town || address.village || address.municipality || address.hamlet || address.locality || "N/A"}, ${address.country}`.trim(); //Text contenu dans la suggestion
              li.addEventListener('click', () => { // Quand tu cliques sur la suggestion
                if (routingControl) {
                  map.removeControl(routingControl); // Retirer ce qui relie 2 points 
                }
  
                const lat = parseFloat(place.lat); // Nombre à virgule
                const lon = parseFloat(place.lon);
                map.setView([lat, lon], 13); // Position + Zoom sur la ville (13) que pour les suggestions
                sug.innerHTML = '';
                inp.value = li.textContent; // Ville + pays dans la barre de recherche
                
                if(markerType === 'markerStart') 
                {
                  if(markerStart){
                    markerStart.remove(); // Si déjà marqueur ça le retire 
                  }

                  markerStart = L.marker([lat, lon]).addTo(map)
                  .bindTooltip(`${word} : ${li.textContent}`, { permanent: true, direction: 'top' })
                  .openTooltip(); // Ajoute un nouveau marqueur 
                }

                if(markerType === 'markerEnd')
                  {
                    if(markerEnd){
                      markerEnd.remove(); // Si déjà marqueur ça le retire 
                    }

                    markerEnd = L.marker([lat, lon]).addTo(map)
                    .bindTooltip(`${word} : ${li.textContent}`, { permanent: true, direction: 'top' }) // Ecrit le mot + contenu + rendre permanant et placement du texte par rapport au marqueur
                    .openTooltip(); 
                }

                goTo(); // tracer le trajet
              });
              sug.appendChild(li);
            }
          });
        });
    }, 300); // délai anti-spam
}

inputStart.addEventListener('input', () => findAndValidateSuggestion(inputStart, suggestionsStart, 'markerStart', "Départ")); // Exécute la fonction pour chaque modifications de caractère 

inputEnd.addEventListener('input', () => findAndValidateSuggestion(inputEnd, suggestionsEnd, 'markerEnd', "Arrivée"));

// Fermer les suggestions si on clique ailleurs
document.addEventListener('click', (e) => {
  if (e.target !== inputStart && e.target !== inputEnd) {
      suggestionsStart.innerHTML = '';
      suggestionsEnd.innerHTML = '';
    }
  });

function modifyStart() { // Click souris sur la carte, afin de remplir le départ 
  if (routingControl) { // Si trajet déjà présent 
    map.removeControl(routingControl); // Le retire
  }
  const lat = parseFloat(latChoosed); // Fixe la latitude
  const lng = parseFloat(lngChoosed); // Fixe la longitude
  map.setView([lat, lng], 13); // zoom sur la carte 
  
  var info = `${cityFound}, ${countryFound}`.trim();
  inputStart.value = info;
  
  if(markerStart)
  {
    markerStart.remove();
  }

  markerStart = L.marker([lat, lng]).addTo(map) // Fixe le marqueur de départ sur la carte en fonction de la longitude et de la latitude
  .bindTooltip(`Départ : ${info}`, { permanent: true, direction: 'top' })
  .openTooltip();

  $('#modalChooseStartEnd').modal('hide');

  goTo();
}

function modifyEnd() { // Click souris sur la carte, afin de remplir l'arrivé, même système que pour le départ
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

function goTo(){ // Tracer le trajet sur la carte
  if (!markerStart || !markerEnd) { // Si pas les 2 points ne fait rien
    
    return
  }

  if (routingControl) { // Si il y les 2 points les remplaces
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
      styles: [{ color: 'blue', opacity: 0.7, weight: 5 }] // Style du tracé
    }
  }).addTo(map);
}
