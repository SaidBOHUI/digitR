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

  useEffect(() => {
    const loadModel = async () => {
      setIsLoading(true);
      try {
        const loadedModel = await tf.loadLayersModel(
          "http://localhost:4000/model/model.json"
        );
        setModel(loadedModel);
      } catch (error) {
        console.error("Failed to load model", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
    if(sessionStorage.getItem("CAPTCHA")==="true") setShowModalCaptcha(false)
  }, []);

  const canvasToImageData = (canvas) => {
    const context = canvas.getContext("2d");
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const pixels = [];

    for (let i = 0; i < data.length; i += 4) {
      const grayscale = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
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

    if (!canvas || !model) return;

    !captcha ? setIsLoading(true) : setIsLoadingCaptcha(true);
    try {
      const tensorImage = await preprocessCanvasImage(canvas);
      const predictionArray = await model.predict(tensorImage).data();
      const predictedIndex = predictionArray.indexOf(
        Math.max(...predictionArray)
      );
      if (!captcha) {
        setPrediction(`Prédiction : ${predictedIndex}`);
        const pixelJSON = canvasToImageData(canvas);
        pixelJSON["resultat"] = predictedIndex;
        const response = await axios.post(
          "http://localhost:4000/numbers/",
          pixelJSON
        );
        console.log("Réponse du serveur :", response.data);
      } else {
        if (predictionArray.some((num) => num > 0.7)) {
          handleCloseCaptcha();
          sessionStorage.setItem("CAPTCHA", "true");
        } else {
          setResultCaptcha("Ce n'est pas un numéro");
          refaireDessin(true);
        }
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
  }, [prediction]); // Recheck whenever a prediction is made to ensure state reflects the current canvas status

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
      <ModalBoot
        show={showModalCaptcha}
        onHide={handleCloseCaptcha}
        backdrop="static"
        keyboard={false}
        >
        <ModalBoot.Header>
          <ModalBoot.Title>Captcha</ModalBoot.Title>
        </ModalBoot.Header>
        <ModalBoot.Body>
          <p>
            Dessinez un chiffre pour prouver que vous n'êtes pas une machine
          </p>
          <div style={{ border: "2px solid #000", padding: "10px" }}>
            <CanvasDraw
              ref={canvasRefCaptcha}
              brushRadius={13}
              lazyRadius={0}
              canvasWidth={400}
              canvasHeight={400}
              onChange={() => setIsCanvasEmptyCaptcha(false)}
            />
          </div>
          {resultCaptcha !== "" ? <p>{resultCaptcha}</p> : <></>}
        </ModalBoot.Body>
        <ModalBoot.Footer>
          <ButtonBoot
            onClick={() => {
              envoyerDessin(true);
            }}
            disabled={isCanvasEmptyCaptcha || isLoadingCaptcha}
            variant="primary">
            {isLoadingCaptcha ? (
              <CircularProgress size={24} />
            ) : (
              "Confirmer"
            )}
          </ButtonBoot>{" "}
        </ModalBoot.Footer>
      </ModalBoot>
    </Container>
  )
}

export default DessinCanvas
