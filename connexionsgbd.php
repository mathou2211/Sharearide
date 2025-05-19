<?php 
define('USER','ebus2');
define('PASSWD','2AT5z-62B4.QSr');
define('SERVER','localhost'); // à demander à votre hébergeur
define('BASE','ebus2bdapps');

// 1. connexion à la SGBD
$dsn = 'mysql:host=' . SERVER . ';dbname=' . BASE;
try {
    $connexion = new PDO($dsn, USER, PASSWD);
} catch(PDOException $e) {
    echo 'Échec de la connexion : ' . $e->getMessage(); // prudence aux infos fournies
    exit();
}

// 2. écrire son SQL (SELECT)

if (isset($_GET['continent']) && $_GET['continent'] != '')
{
    $sql = 'SELECT code, name, currency, continent
        FROM country
        WHERE continent = :con
        ORDER BY name ASC, code    -- fortement conseillé si on fait un LIMIT
        LIMIT 5';
}
else
{
    $sql = 'SELECT code, name, currency, continent
        FROM country
        ORDER BY name ASC, code    -- fortement conseillé si on fait un LIMIT
        LIMIT 5';
}

// 3. envoyer ce SQL à SGBD : qu'il se prépare => req/statement
$statement = $connexion->prepare($sql);

// 4. (evt) donner les paramètres
if (isset($_GET['continent']) && $_GET['continent'] != '')
{
    $statement->bindParam(':con', $_GET['continent'], PDO::PARAM_STR);
}

// 5. SGBD d'exécuter la demande
$statement->execute();

// 6. demander la réponse
$lignes = $statement->fetchAll();

// 7. (evt) traiter

// 8. afficher : echo
echo json_encode($lignes);

?>