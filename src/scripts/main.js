import { generateLowPolyImageData } from "./lowpoly.js";

setUpForm();

let numTriangulationPoints = 2500;
let inputImgSrc = undefined;

function setUpForm() {
  const generateButton = document.getElementById("generateButton");

  const imageInput = document.getElementById("imageInput");
  imageInput.addEventListener("input", function () {
    if (this.files && this.files[0]) {
      inputImgSrc = URL.createObjectURL(this.files[0]);
      const inputImg = document.getElementById("inputImg");
      inputImg.src = inputImgSrc;
      generateButton.disabled = false;
    }
  });

  // TODO: fix behaviour after page reload
  const rangeInput = document.getElementById('numTrianglePoints');
  const rangeOutput = document.getElementById('numTrianglePointsValue');
  // Set initial value
  rangeOutput.textContent = 2500;

  rangeInput.addEventListener('input', function () {
    numTriangulationPoints = this.value;
    rangeOutput.textContent = this.value;
  });

  generateButton.addEventListener("click", () => {
    if (!inputImgSrc) {
      alert("No image selected");
      return;
    }
    generateLowPoly(inputImgSrc, numTriangulationPoints);
  });
}

function generateLowPoly(src, numTriangulationPoints) {
  // load input image
  const inputImg = document.getElementById("inputImg");
  inputImg.src = src;
  inputImg.addEventListener("load", () => {
    const imageWidth = inputImg.width;
    const imageHeight = inputImg.height;

    // create canvas for input img to get imageData
    const canvas = new OffscreenCanvas(imageWidth, imageHeight)
    const ctx = canvas.getContext("2d");
    ctx.drawImage(inputImg, 0, 0, imageWidth, imageHeight);
    const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);

    // generate low poly data
    const lowPolyImageData = generateLowPolyImageData(imageData, numTriangulationPoints);

    // create canvas and draw image
    const outputCanvas = new OffscreenCanvas(imageWidth, imageHeight);
    const outputCtx = outputCanvas.getContext("2d");
    outputCtx.putImageData(lowPolyImageData, 0, 0);

    // create img from canvas
    outputCanvas.convertToBlob().then((blob) => {
      const outputImg = document.getElementById("outputImg");
      outputImg.src = URL.createObjectURL(blob);;
    });
  });
}
