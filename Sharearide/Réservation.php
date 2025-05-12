<?php
// Définir les constantes pour la connexion à la base de données
define('USER', 'ebus2');
define('PASSWD', '2AT5z-62B4.QSr');
define('SERVER', 'localhost');
define('BASE', 'ebus2bdapps');

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

<div class="container-center">

    <div id="form">
    {{ error }}
    <!-- method = get post -->

    <div class="border border-secondary rounded" style="padding: 20px;">

        <form action="traiter_les_donnees_envoyees.php" method="post">

        <h2 class="text-center text-primary">Réservez un voyage</h2>
        
        <div class="form-group">

            <label for="lc">Départ </label>
            <input class="form-control" type="text" name="hc" id="lc"><br>

            <label for="arrive">Arrivé</label>
            <input class="form-control" id="arrive" type="text" name="hn"><br>

            <div class="d-flex flex-row justify-content-around">

                <div class="d-flex flex-row">
                    <label class="input-group-text" for="start">Date</label>
                    <input class="form-control"
                    type="date"
                    id="start"
                    name="trip-start"
                    value=""
                    min="2025-01-01"
                    max="2030-12-31" />
                </div>
                <div class="d-flex flex-row">
                    <label class="input-group-text" for="appt">Heure</label>
                    <input class="form-control" type="time" id="appt" name="appt" min="09:00" max="18:00" required />
                </div>
            </div>
        </div>

        <fieldset class="border-top border-bottom border-secondary mt-3" style="padding: 10px;">

        <legend class="text-center text-primary">Est-ce que vous avez une préférence ?</legend>
        <div class="d-flex flex-column m-3">
            <input class="btn-check" type="radio" name="r" id="ja" value="yes">
            <label class="btn btn-outline-primary" for="ja">Homme</label>

            <input class="btn-check" type="radio" name="r" id="nee" value="no">
            <label class="btn btn-outline-primary" for="nee">Femme</label>

            <input class="btn-check" type="radio" name="r" id="whynot" value="maybe" checked>
            <label class="btn btn-outline-primary" for="whynot">Peu importe</label>
        </div>

        </fieldset>

        </form>
        <div class="d-flex flex-row justify-content-center mt-3">
            <a class="btn btn-outline-primary w-25" href="choix.html">Retour</a>
        </div>
        </div>
    </div>
</div>
<a href="pagedaccueil.html" class="btn btn-secondary position-fixed top-0 start-0 m-3 z-3">
    ⬅ Accueil
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

</body>

</html>