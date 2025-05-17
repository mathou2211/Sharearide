	
<?php
// Définir les constantes pour la connexion à la base de données
session_start();
require_once ' ..config.php' ;
header('content-Type: application/json')

// 1. Connexion à la SGBD avec gestion des erreurs
$dsn = 'mysql:host=' . SERVER . ';dbname=' . BASE . ';charset=utf8';
try {
    $connexion = new PDO($dsn, USER, PASSWD, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    // Ne pas exposer les détails de l'erreur en production
    http_response_code(500);
    echo json_encode(['error' => 'Échec de la connexion à la base de données']);
    exit();
}

// 2. Préparer la requête SQL
$continent = isset($_GET['continent']) ? trim($_GET['continent']) : '';

if ($continent !== '') {
    $sql = 'SELECT code, name, currency, continent 
            FROM country 
            WHERE continent = :con 
            ORDER BY name ASC, code 
            LIMIT 5';
} else {
    $sql = 'SELECT code, name, currency, continent 
            FROM country 
            ORDER BY name ASC, code 
            LIMIT 5';
}

// 3. Préparer la requête
try {
    $statement = $connexion->prepare($sql);

    // 4. Lier les paramètres si nécessaire
    if ($continent !== '') {
        $statement->bindParam(':con', $continent, PDO::PARAM_STR);
    }

    // 5. Exécuter la requête
    $statement->execute();

    // 6. Récupérer les résultats
    $lignes = $statement->fetchAll();

    // 7. Définir le type de contenu et retourner la réponse
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($lignes);
} catch (PDOException $e) {
    // Gestion des erreurs d'exécution de la requête
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors de l\'exécution de la requête']);
    exit();
}

// 8. Fermer la connexion (optionnel, PHP le fait automatiquement en fin de script)
$connexion = null;
?>


<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8" />

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-SgOJa3DmI69IUzQ2PVdRZhwQ+dy64/BUtbMJw1MZ8t5HZApcHrRKUc4W0kG879m7" crossorigin="anonymous">
<link rel="stylesheet" href="css\stylesheet.css">
</head>

<body>

<div id="form">

{{ error }}

<!-- method = get post -->

    <form action="traiter_les_donnees_envoyees.php" method="post">

    <div class="container-center">
        <div class="border border-secondary rounded" style="padding: 30px 50px;">

        <h2 class="text-center text-primary mb-3">Inscription</h2>
        
        <div class="form-group">
            <label for="lc">Nom</label>
            <input class="form-control" type="text" name="hc" id="lc"><br>

            <label for="forename">Prénom</label>
            <input class="form-control" type="text" name="hn" id="forename"><br>

    
            <label for="email">Adresse e-mail</label>
            <input class="form-control"
         type="email"
         id="email"
         name="email"
         placeholder="exemple@domaine.com"
         required />
         <label class="mt-3" for="password">Mot de passe</label>
<input class="form-control"
       type="password"
       id="password"
       name="password"
       placeholder="Entrez votre mot de passe"
       required />


           
            <label class="mt-3" for="phone">Téléphone</label>
            <input class="form-control" type="tel" id="phone" name="phone" pattern="[0-9]{12}" placeholder="0123456789" required />
        </div>

        <fieldset class="border-top border-bottom border-secondary mt-3" style="padding: 10px;">
            <legend class="text-center text-primary">Vous êtes :</legend>
            <div class="form-group d-flex gap-3">
              <div>
                <input type="radio" id="passager" name="role" value="passager" checked>
                <label for="passager">Passager</label>
              </div>
              <div>
                <input type="radio" id="conducteur" name="role" value="conducteur">
                <label for="conducteur">Conducteur</label>
              </div>
            </div>
          </fieldset>

        <div id="vehicule-section" style="display: none;">
            <fieldset class="border-top border-bottom border-secondary mt-3" style="padding: 10px;">
              <legend class="text-center text-primary">Votre véhicule</legend>
          
              <div class="form-group">
                <label for="marque">Marque :</label>
                <select id="marque" name="marque" class="form-control">
                  <option value="">Choisissez une marque</option>
                </select>
          
                <label class="mt-3" for="modele">Modèle :</label>
                <input type="text" class="form-control" id="modele" name="modele" placeholder="Ex : Clio">
          
                <label class="mt-3" for="immatriculation">Immatriculation :</label>
                <input type="text" class="form-control" id="immatriculation" name="immatriculation" placeholder="Ex : ABC-123">
              </div>
            </fieldset>
        </div>

        <div class="d-flex flex-row" style="margin: 15% 0 5% 0;">
            <a href="choix.html" class="btn btn-outline-primary w-75">S'inscrire</a>
            <a href="pagedaccueil.html" class="btn btn-outline-secondary">Annuler</a>
        </div>

        </div>
    </div>
    </form>
</div>
<a href="pagedaccueil.html" class="btn position-fixed top-0 start-0 m-3 z-3" 
   style="background-color: #0d6efd; color: white; border: 2px solid #0d6efd">
    Accueil
</a>
<script>

const { createApp } = Vue

createApp({

data() {

return {

error: ''

}

},

async mounted() {

let paramsString = new URL(window.location.href).searchParams;

let searchParams = new URLSearchParams(paramsString);

this.error = searchParams.has("msg") ? searchParams.get("msg") : '';

}

}).mount('#form')

</script>

<script>
    // Sélectionne tous les boutons radio qui permettent de choisir "passager" ou "conducteur"
    document.querySelectorAll('input[name="role"]').forEach(input => {
      
      // À chaque fois qu'on clique sur un des deux boutons radio...
      input.addEventListener('change', () => {
    
        // Va chercher la partie du formulaire qui contient les champs "véhicule"
        const vehiculeSection = document.getElementById('vehicule-section');
    
        // Si l'utilisateur a coché "Conducteur"
        if (document.getElementById('conducteur').checked) {
    
          // Affiche la partie "véhicule"
          vehiculeSection.style.display = 'block';
    
          // Rend les champs obligatoires pour le conducteur
          document.getElementById('marque').setAttribute('required', 'required');
          document.getElementById('modele').setAttribute('required', 'required');
          document.getElementById('immatriculation').setAttribute('required', 'required');
    
        } else {
          // Si c'est un passager, cache la section "véhicule"
          vehiculeSection.style.display = 'none';
    
          // Enlève l'obligation de remplir les champs
          document.getElementById('marque').removeAttribute('required');
          document.getElementById('modele').removeAttribute('required');
          document.getElementById('immatriculation').removeAttribute('required');
        }
      });
    });
</script>


<script>
    // "fetch" pour aller chercher le fichier "marques.json"
    fetch('marques.json')
      .then(response => {
        // Si le fichier ne se charge pas correctement --> erreur
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des marques');
        }
    
        // Si pas d'erreur, transforme le contenu du fichier en données utilisables (tableau JS)
        return response.json();
      })
      .then(marques => {
        // Récupère l'élément <select> dans le formulaire où on va insérer les options
        const select = document.getElementById('marque');
    
        // Pour chaque marque dans le fichier JSON...
        marques.forEach(marque => {
          // Crée une nouvelle <option> dans le menu déroulant
          const option = document.createElement('option');
    
          // La valeur de cette option sera le nom de la marque
          option.value = marque;
    
          // Le texte affiché dans le menu sera aussi le nom de la marque
          option.textContent = marque;
    
          // On ajoute cette option dans le <select>
          select.appendChild(option);
        });
      })
      .catch(error => {
        // Si erreur, affiche l'erreur dans la console
        console.error('Erreur fetch marques.json :', error);
      });
</script>

</body>

</html>