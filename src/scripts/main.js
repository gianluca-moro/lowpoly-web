/**
 * Author: https://github.com/gianluca-moro
 */

import { generateLowPolyFromImageSrcUrl } from './lowpoly.js';


let numTriangulationPoints = 2500;
let minNumTriangulationPoints = 250;
let maxNumTriangulationPoints = 10000;
let inputImgSrc = undefined;
let inputImgName = undefined;

const inputImageContainer = document.getElementById('inputImage');
inputImageContainer.classList.add('hidden');
const outputImageContainer = document.getElementById('outputImage');
outputImageContainer.classList.add('hidden');
const generateButton = document.getElementById('generateButton');
const downloadButton = document.getElementById('downloadButton');
downloadButton.onclick = download;

setUpForm();

function setUpForm() {
  generateButton.disabled = true;

  const imageInput = document.getElementById('imageInput');
  const inputImg = document.getElementById('inputImg');
  imageInput.value = '';
  inputImg.addEventListener('load', () => {
    generateButton.disabled = false;
  });
  imageInput.addEventListener('input', function () {
    if (this.files && this.files[0]) {
      inputImgName = this.files[0].name;
      inputImgSrc = URL.createObjectURL(this.files[0]);
      inputImg.src = inputImgSrc;
      document.getElementById('inputImgAnchor').href = inputImgSrc;
      generateButton.disabled = true;
      inputImageContainer.classList.remove('hidden');
      outputImageContainer.classList.add('hidden');
    }
  });


  const rangeInput = document.getElementById('numTrianglePointsValue');
  const rangeSlider = document.getElementById('numTrianglePointsSlider');
  // Set initial value
  rangeInput.value = 3000;
  rangeSlider.value = 3000;

  rangeInput.addEventListener('input', function () {
    numTriangulationPoints = this.value;
    rangeSlider.value = this.value;
  });
  rangeSlider.addEventListener('input', function () {
    numTriangulationPoints = this.value;
    rangeInput.value = this.value;
  });
  rangeInput.onblur = () => {
    if (minNumTriangulationPoints <= rangeInput.value && rangeInput.value <= maxNumTriangulationPoints) {
      return;
    }
    if (rangeInput.value < minNumTriangulationPoints) {
      rangeInput.value = minNumTriangulationPoints;
    }
    if (rangeInput.value > maxNumTriangulationPoints) {
      rangeInput.value = maxNumTriangulationPoints;
    }
  }


  generateButton.onclick = () => {
    if (!inputImgSrc) {
      alert('No image selected');
      return;
    }
    generateLowPoly(inputImgSrc, numTriangulationPoints);
  };
}

function generateLowPoly(src, numTriangulationPoints) {
  if (numTriangulationPoints < minNumTriangulationPoints || numTriangulationPoints > maxNumTriangulationPoints) {
    alert(`Number of Triangulation Points must be between ${minNumTriangulationPoints} and ${maxNumTriangulationPoints}`);
    return;
  }
  generateButton.disabled = true;

  const inputImage = new Image();
  inputImage.src = src;
  const imageWidth = inputImage.width;
  const imageHeight = inputImage.height;

  // generate low poly data
  const lowPolyImageData = generateLowPolyFromImageSrcUrl(src, numTriangulationPoints);

  // create canvas and draw image
  const outputCanvas = new OffscreenCanvas(imageWidth, imageHeight);
  const outputCtx = outputCanvas.getContext('2d');
  outputCtx.putImageData(lowPolyImageData, 0, 0);

  // create img from canvas
  outputCanvas.convertToBlob().then((blob) => {
    const outputSrc = URL.createObjectURL(blob);
    const outputImg = document.getElementById('outputImg');
    outputImg.onload = () => {
      downloadButton.scrollIntoView(false);
    };
    outputImg.src = outputSrc;
    document.getElementById('outputImgAnchor').href = outputSrc;
    outputImageContainer.classList.remove('hidden');
    generateButton.disabled = false;
  });
}

function download() {
  const link = document.createElement('a');
  link.href = document.getElementById('outputImg').src;
  link.download = 'low-poly-' + (inputImgName ?? '.png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}