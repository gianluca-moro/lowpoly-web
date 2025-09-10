import { generateLowPolyFromImageSrcUrl } from "./lowpoly.js";

setUpForm();

document.getElementById("downloadButton").onclick = download;

let numTriangulationPoints = 2500;
let inputImgSrc = undefined;
let inputImgName = undefined;

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
      inputImgName = this.files[0].name;
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

  generateButton.onclick = () => {
    if (!inputImgSrc) {
      alert("No image selected");
      return;
    }
    generateButton.disabled = true;
    generateLowPoly(inputImgSrc, numTriangulationPoints);
  };
}

function download() {
  const link = document.createElement('a');
  link.href = document.getElementById("outputImg").src;
  link.download = 'low-poly-' + (inputImgName ?? '.png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateLowPoly(src, numTriangulationPoints) {
  const inputImage = new Image();
  inputImage.src = src;
  const imageWidth = inputImage.width;
  const imageHeight = inputImage.height;

  // generate low poly data
  const lowPolyImageData = generateLowPolyFromImageSrcUrl(src, numTriangulationPoints);

  // create canvas and draw image
  const outputCanvas = new OffscreenCanvas(imageWidth, imageHeight);
  const outputCtx = outputCanvas.getContext("2d");
  outputCtx.putImageData(lowPolyImageData, 0, 0);

  // create img from canvas
  outputCanvas.convertToBlob().then((blob) => {
    const outputSrc = URL.createObjectURL(blob);
    document.getElementById("outputImg").src = outputSrc;
    document.getElementById("outputImgAnchor").href = outputSrc;
    outputImageContainer.classList.remove("hidden");
    generateButton.disabled = false;
  });
}
