/**
 * Low-Poly Image converter
 * Author: https://github.com/gianluca-moro
 */

import Delaunator from 'https://cdn.skypack.dev/delaunator@5.0.0';
import * as StackBlur from '../libs/stackblur-es.min.js'


/**
 * Generates a Low-Poly style image of the provided image
 * @param {string} imageSrcUrl The input image src url representation 
 * @param {number} numTrianglePoints Number of points to sample for triangulation
 * @returns {ImageData} ImageData representing the Low-Poly iamge
 */
export function generateLowPolyFromImageSrcUrl(imageSrcUrl, numTrianglePoints = 3000) {
  const inputImage = new Image();
  inputImage.src = imageSrcUrl;
  const imageWidth = inputImage.width;
  const imageHeight = inputImage.height;

  // create offscreen canvas for input img to get imageData
  const canvas = new OffscreenCanvas(imageWidth, imageHeight)
  const ctx = canvas.getContext("2d");
  ctx.drawImage(inputImage, 0, 0, imageWidth, imageHeight);
  const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);

  const lowPolyCtx = drawTriangles(getPoints(imageData), numTrianglePoints, blur(imageData, 3)).getContext('2d');
  if (lowPolyCtx == undefined) throw new Error("Low Poly Canvas Context is undefined");
  return lowPolyCtx.getImageData(0, 0, imageData.width, imageData.height);
}

/**
 * Generates a Low-Poly style image of the provided image
 * @param {ImageData} imageData The input image data
 * @param {number} numTrianglePoints Number of points to sample for triangulation
 * @returns {ImageData} ImageData representing the Low-Poly iamge
 */
export function generateLowPolyFromImageData(imageData, numTrianglePoints = 3000) {
  const lowPolyCtx = drawTriangles(getPoints(imageData), numTrianglePoints, blur(imageData, 3)).getContext('2d');
  if (lowPolyCtx == undefined) throw new Error("Low Poly Canvas Context is undefined");
  return lowPolyCtx.getImageData(0, 0, imageData.width, imageData.height);
}

function getPoints(imageData) {
  console.log('Get points');

  const grayImage = gray(imageData);

  // Blurring images with different strength
  const blurData1 = blur(grayImage, 5).data;
  const blurData2 = blur(grayImage, 9).data;

  const width = imageData.width;
  const height = imageData.height;
  const widthTimesChannels = width * 4;

  let diff = [];
  let currDiff = 0.0;
  let maxDiff = -1.0;
  let currIndex = 0;
  for (let r = 0; r < height; r++) {
    diff[r] = [];
    for (let c = 0; c < width; c++) {
      currIndex = r * widthTimesChannels + c * 4;    // y * (width * channels) + x * channels
      currDiff = blurData1[currIndex] - blurData2[currIndex];
      if (currDiff < 0) {
        currDiff *= 0.1;
      }

      diff[r][c] = currDiff;
      maxDiff = Math.max(maxDiff, currDiff);
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      diff[r][c] = Math.sqrt(Math.abs(diff[r][c]) / maxDiff);
    }
  }

  let samples = rejectionSampling(diff);

  // Add random points on the borders to mitigate ugly looking ultra-small stretched triangles at the edges
  const corners = [[0, 0], [0, height - 1], [width - 1, 0], [width - 1, height - 1]];
  const topBorder = getMultipleRandomInts(1, height - 2, 60).map(x => [0, x]);
  const bottomBorder = getMultipleRandomInts(1, height - 2, 60).map(x => [width - 1, x]);
  const leftBorder = getMultipleRandomInts(1, width - 2, 60).map(x => [x, 0]);
  const rightBorder = getMultipleRandomInts(1, width - 2, 60).map(x => [x, height - 1]);

  return corners.concat(topBorder, bottomBorder, leftBorder, rightBorder, samples);
}

function gray(imageData) {
  const data = imageData.data;
  const grayData = new Uint8ClampedArray(imageData.data.length);

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3.0;
    grayData[i] = avg;
    grayData[i + 1] = avg;
    grayData[i + 2] = avg;
  }

  return new ImageData(grayData, imageData.width, imageData.height);
}

function blur(img, radius) {
  const imgData = new ImageData(img.data.slice(), img.width, img.height);
  return StackBlur.imageDataRGB(imgData, 0, 0, img.width, img.height, radius);
}

function rejectionSampling(imgPoints, n = 500000) {
  console.log(`Performing rejection sampling on ${n} points`);
  let height = imgPoints.length;
  let width = imgPoints[0].length;

  let xs = getMultipleRandomInts(0, height, n);
  let ys = getMultipleRandomInts(0, width, n);

  let acceptedPoints = [];
  for (let index = 0; index < n; index++) {
    if (Math.random() < imgPoints[xs[index]][ys[index]]) {
      acceptedPoints.push([ys[index], xs[index]]);
      // Note: Intentionally [ys, xs] because for drawing first coord must be column (max is width)
      //      and second coord must be row (max is height)
    }
  }

  console.log(`\tAccepted ${acceptedPoints.length} points`);
  return acceptedPoints;
}

function drawTriangles(allPoints, numPoints = 6000, imageData) {
  if (allPoints.length < 250) throw new Error(`Not enough sample points to triangulate. Only ${allPoints.length} samples were provided.`);
  if (numPoints < 250) throw new Error(`The number of points to triangulate must be >= 250.\nOnly ${numPoints} points were provided.`);

  console.log(`Triangulating ${numPoints} points`);
  const selectedPoints = allPoints.slice(0, numPoints);
  const triangulation = Delaunator.from(selectedPoints);
  const triangles = triangulation.triangles;

  console.log(`Drawing ${triangles.length / 3} triangles`);
  const outputCanvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = outputCanvas.getContext('2d', { alpha: false });
  if (ctx == undefined) throw new Error("Canvas context undefined in drawTriangles()");

  let a, b, c;
  let midPoint, color;
  for (let i = 0; i < triangles.length; i += 3) {
    a = selectedPoints[triangles[i]];
    b = selectedPoints[triangles[i + 1]];
    c = selectedPoints[triangles[i + 2]];

    midPoint = [Math.round((a[0] + b[0] + c[0]) / 3.0), Math.round((a[1] + b[1] + c[1]) / 3.0)];
    color = getPixelColor(imageData, midPoint[0], midPoint[1]);

    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.stroke();
    ctx.fill();
  }

  console.log("Finished creating low poly iamge");
  return outputCanvas;
}

function getPixelColor(imageData, x, y) {
  const data = imageData.data;
  const base = y * (imageData.width * 4) + x * 4;     // y * (width * channels) + x * channels
  return "rgb(" + data[base] + "," + data[base + 1] + "," + data[base + 2] + ")";
}

/**
 * Generates a pseudorandom integer in the range [min, max)
 * @param min Lower range bound (inclusive)
 * @param max Upper range bound (exclusive)
 * @returns Pseudorandom integer in range [min, max)
 */
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Generates n pseudorandom integers, all in range [min, max)
 * @param min Lower range bound (inclusive)
 * @param max Upper range bound (exclusive)
 * @param n The amount of integers to generate
 * @returns n pseudorandom integers, each in range [min, max)
 */
export function getMultipleRandomInts(min, max, n) {
  let randoms = [];
  for (let i = 0; i < n; i++) {
    randoms.push(getRandomInt(min, max));
  }
  return randoms;
}
