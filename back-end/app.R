library(plumber)
library(mongolite)
library(jsonlite)
library(tensorflow) 

db_conn <- mongo(collection = "user_drawings", db = "Digit_Recognition", url = "mongodb+srv://admin:admin@cluster0.26heell.mongodb.net/")

model <- load_model_hdf5("/Users/said/IPSSI/M2/week_7_R/digitR/back-end/dataModel/model.h5")


predict_digit <- function(pixels) {
  tensor_input <- array(as.numeric(pixels), dim = c(1, 28, 28, 1)) 
  prediction <- predict(model, tensor_input)
  
  predicted_digit <- which.max(prediction) - 1
  return(predicted_digit)
}

#* @post /predict
function(req, res) {
  body <- fromJSON(req$postBody)
  if (is.null(body$pixels) || length(body$pixels) == 0) {
    res$status <- 400
    return(list(error = "No pixels provided for prediction."))
  }
  predicted_digit <- predict_digit(body$pixels)
  res$status <- 200
  return(list(predicted_digit = predicted_digit))
}

# 4. Fonctionnalités MongoDB : Ajouter un dessin dans la base de données
#* @post /numbers
function(req, res) {
  body <- fromJSON(req$postBody)
  # Validation des données
  if (is.null(body$pixels) || length(body$pixels) == 0 || is.null(body$resultat)) {
    res$status <- 400
    return(list(error = "Invalid drawing data or missing result provided."))
  }
  new_drawing <- list(pixels = body$pixels, resultat = body$resultat)
  db_conn$insert(new_drawing)

  res$status <- 201
  return(list(message = "Dessin ajouté avec succès"))
}

# 5. Fonctionnalités MongoDB : Récupérer tous les dessins
#* @get /numbers
function(req, res) {
  drawings <- db_conn$find("{}")
  return(drawings)
}

#* @get /numbers/<id>
function(req, res, id) {
  drawing <- db_conn$find(paste0('{"_id": {"$oid": "', id, '"}}'))  # Recherche par ID
  
  if (length(drawing) == 0) {
    res$status <- 404
    return(list(error = "Dessin introuvable"))
  }
  
  return(drawing)
}

#* @delete /numbers/<id>
function(req, res, id) {
  result <- db_conn$remove(paste0('{"_id": {"$oid": "', id, '"}}'))
  if (result$nRemoved == 0) {
    res$status <- 404
    return(list(error = "Dessin introuvable"))
  }
  res$status <- 200
  return(list(message = "Dessin supprimé avec succès"))
}

# 8. Démarrer le serveur plumber
pr <- plumber::plumb("app.R")
pr$run(port = 4000)
