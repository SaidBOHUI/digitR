import React, { useRef, useState, useEffect } from "react"
import CanvasDraw from "react-canvas-draw"
import { Button, Container, Typography, Box, CircularProgress, Modal, Backdrop } from "@mui/material"
import "bootstrap/dist/css/bootstrap.min.css"
import { Button as ButtonBoot, Modal as ModalBoot } from 'react-bootstrap';
import * as tf from "@tensorflow/tfjs"
import axios from "axios"

const DessinCanvas = () => {
  const canvasRef = useRef(null);
  const canvasRefCaptcha = useRef(null);
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [isCanvasEmptyCaptcha, setIsCanvasEmptyCaptcha] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalCaptcha, setShowModalCaptcha] = useState(true);
  const [resultCaptcha, setResultCaptcha] = useState("");

  // useEffect(() => {
  //   const loadModel = async () => {
  //     setIsLoading(true);
  //     try {
  //       const loadedModel = await tf.loadLayersModel(
  //         "http://localhost:4000/model/model.json"
  //       );
  //       setModel(loadedModel);
  //     } catch (error) {
  //       console.error("Failed to load model", error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   loadModel();
  //   if(sessionStorage.getItem("CAPTCHA")==="true") setShowModalCaptcha(false)
  // }, []);

  const resizeCanvasTo28x28 = (canvas) => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempContext = tempCanvas.getContext("2d");
  
    // Draw the original canvas content scaled down to 28x28
    tempContext.drawImage(canvas, 0, 0, 28, 28);
  
    return tempCanvas;
  };

  const canvasToImageData = (canvas) => {
    const resizedCanvas = resizeCanvasTo28x28(canvas);
    const context = resizedCanvas.getContext("2d");
    const imageData = context.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);
    const data = imageData.data;
    const pixels = [];

    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const grayscale = Math.floor((red + green + blue) / 3); 
    pixels.push(grayscale);
    }
    return { pixels };
  };

  const preprocessCanvasImage = async (canvas) => {
    let tensor = tf.browser
      .fromPixels(canvas)
      .resizeNearestNeighbor([28, 28])
      .mean(2)
      .expandDims(2)
      .toFloat()
      .div(tf.scalar(255.0))
      .expandDims();
    return tensor;
  };

  const envoyerDessin = async (captcha) => {
    let canvas;
    !captcha
      ? (canvas = canvasRef.current.canvasContainer.childNodes[1])
      : (canvas = canvasRefCaptcha.current.canvasContainer.childNodes[1]);

    if (!canvas) return;

    !captcha ? setIsLoading(true) : setIsLoadingCaptcha(true);
    try {
      if (!captcha) {
        const pixelJSON = canvasToImageData(canvas);
        const response = await axios.post(
          "http://127.0.0.1:4000/predict",
          pixelJSON
        )
        setPrediction(response.data.predicted_digit[0])
        console.log("Réponse du serveur :", response.data);
      } 
    } catch (error) {
      console.error("Erreur lors de la prédiction :", error);
      !captcha
        ? setPrediction("Erreur lors de la classification.")
        : setPrediction("");
    } finally {
      if (!captcha) {
        setIsLoading(false);
        setShowModal(true);
      } else {
        setIsLoadingCaptcha(false);
      }
    }
  };

  const refaireDessin = (captcha) => {
    if (!captcha) {
      canvasRef.current.clear();
      setPrediction("");
      setIsCanvasEmpty(true);
      setShowModal(false);
    } else {
      canvasRefCaptcha.current.clear();
      setIsCanvasEmptyCaptcha(true);
    }
  };

  useEffect(() => {
    const verifierSiCanvasEstVide = () => {
      const dataVierge = canvasRef.current.getSaveData();
      setIsCanvasEmpty(dataVierge === '{"lines":[],"width":400,"height":400}');
    };
    verifierSiCanvasEstVide();
  }, [prediction]); 

  const handleClose = () => {
    setShowModal(false);
    refaireDessin(false);
  };
  const handleCloseCaptcha = () => {
    refaireDessin(true);
    setShowModalCaptcha(false);
  };

  return (
    <Container
      className="container mt-3"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Box style={{ border: "2px solid #ffffff", padding: "10px" }}>
        <CanvasDraw
          ref={canvasRef}
          brushRadius={13}
          lazyRadius={0}
          canvasWidth={400}
          canvasHeight={400}
          onChange={() => setIsCanvasEmpty(false)}
        />
      </Box>
      <Box className="mt-3" display="flex" gap={2}>
        <Button
          onClick={() => {
            envoyerDessin(false);
          }}
          disabled={isCanvasEmpty || isLoading}
          variant="contained"
          color="primary"
        >
          {isLoading ? (
            <CircularProgress size={24} />
          ) : (
            "Classifier"
          )}
        </Button>
        <Button onClick={() =>{refaireDessin(false)}} variant="contained" color="secondary">
          Refaire
        </Button>
      </Box>
      <Modal
        open={showModal}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Box
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            backgroundColor: "#424242",
            color: "white",
            border: "2px solid #000",
            boxShadow: 24,
            padding: 4,
          }}
        >
          <Typography variant="h6" component="h2">
            Résultat de la prédiction
          </Typography>
          <Typography variant="body2">
            {prediction}
          </Typography>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button variant="contained" onClick={handleClose} color="primary">
              Fermer
            </Button>
          </Box>
        </Box>
      </Modal>
      
    </Container>
  )
}

export default DessinCanvas
