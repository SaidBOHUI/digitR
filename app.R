library(shiny)
library(ggplot2)  # Assure-toi que ggplot2 est bien chargé

# Interface utilisateur
ui <- fluidPage(
  titlePanel("Mon Application Shiny"),
  sidebarLayout(
    sidebarPanel(
      actionButton("classify", "Classifier"),
      actionButton("reset", "Effacer le dessin")
    ),
    mainPanel(
      plotOutput("canvasPlot"),
      textOutput("prediction")
    )
  )
)

# Logique serveur
server <- function(input, output, session) {
  # Placeholder pour le canvas (zone de dessin)
  output$canvasPlot <- renderPlot({
    ggplot() +
      geom_blank() +
      labs(title = "Canvas de dessin") +
      theme_void()  # Utilisation correcte de theme_void
  })
  observeEvent(input$classify, {
    output$prediction <- renderText({
      "Prédiction : 5"  # Simule une prédiction
    })
  })
  observeEvent(input$reset, {
    output$canvasPlot <- renderPlot({
      ggplot() +
        geom_blank() +
        labs(title = "Canvas réinitialisé") +
        theme_void()  # Réinitialisation du canvas
    })
    output$prediction <- renderText({
      ""  # Réinitialise la prédiction
    })
  })
}

# Lancer l'application
shinyApp(ui = ui, server = server)
