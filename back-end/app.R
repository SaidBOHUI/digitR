library(plumber)
library(mongolite)
library(jsonlite)
library(tensorflow)

# MongoDB connection
urlbdd <- "mongodb+srv://admin:admin@cluster0.26heell.mongodb.net/"
collecbdd <- "user_drawings"
db_conn <- mongo(collection = collecbdd, db = "Digit_Recognition", url = urlbdd)


# CORS headers filter
#' @filter cors
cors <- function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")

  # Handle preflight OPTIONS request
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200 
    return(list())
  }

  plumber::forward()
}

predict_digit <- function(pixels) {
  tensor_input <- array(as.numeric(pixels), dim = c(1, 28 * 28))
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
  new_drawing <- list(pixels = body$pixels, resultat = predicted_digit)
  db_conn$insert(new_drawing)
  return(list(predicted_digit = predicted_digit))
}

#* @post /number
function(req, res) {
  body <- fromJSON(req$postBody)

  if (is.null(body$pixels) || length(body$pixels) == 0 || is.null(body$resultat)) {
    res$status <- 400
    return(list(error = "Invalid drawing data or missing result provided."))
  }

  new_drawing <- list(pixels = body$pixels, resultat = body$resultat)
  db_conn$insert(new_drawing)

  res$status <- 201
  return(list(message = "Drawing added successfully"))
}

#* @get /numbers
function(req, res) {
  drawings <- db_conn$find("{}")
  return(drawings)
}

#* @get /numbers/<id>
function(req, res, id) {
  drawing <- db_conn$find(paste0('{"_id": {"$oid": "', id, '"}}')) # Search by ID

  if (length(drawing) == 0) {
    res$status <- 404
    return(list(error = "Drawing not found"))
  }

  return(drawing)
}

#* @delete /numbers/<id>
function(req, res, id) {
  result <- db_conn$remove(paste0('{"_id": {"$oid": "', id, '"}}'))

  if (result$nRemoved == 0) {
    res$status <- 404
    return(list(error = "Drawing not found"))
  }

  res$status <- 200
  return(list(message = "Drawing successfully deleted"))
}
