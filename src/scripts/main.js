import { generateLowPolyImageData } from "./lowpoly.js";

setUpForm();

let numTriangulationPoints = 2500;
let inputImgSrc = undefined;

const inputImageContainer = document.getElementById("inputImage");
inputImageContainer.classList.add("hidden");
const outputImageContainer = document.getElementById("outputImage");
outputImageContainer.classList.add("hidden");

function setUpForm() {
  const generateButton = document.getElementById("generateButton");
  generateButton.disabled = true;

  const imageInput = document.getElementById("imageInput");
  const inputImg = document.getElementById("inputImg");
  imageInput.value = "";
  inputImg.addEventListener("load", () => {
    generateButton.disabled = false;
  });
  imageInput.addEventListener("input", function () {
    if (this.files && this.files[0]) {
      inputImgSrc = URL.createObjectURL(this.files[0]);
      inputImg.src = inputImgSrc;
      document.getElementById("inputImgAnchor").href = inputImgSrc;
      generateButton.disabled = true;
      inputImageContainer.classList.remove("hidden");
      outputImageContainer.classList.add("hidden");
    }
  });

  const rangeInput = document.getElementById('numTrianglePoints');
  const rangeOutput = document.getElementById('numTrianglePointsValue');
  // Set initial value
  rangeInput.value = 2500;
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
    const outputSrc = URL.createObjectURL(blob);
    const outputImg = document.getElementById("outputImg").src = outputSrc;
    document.getElementById("outputImgAnchor").href = outputSrc;
    outputImageContainer.classList.remove("hidden");
  });
}
