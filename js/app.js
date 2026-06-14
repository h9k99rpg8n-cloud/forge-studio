import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { TransformControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/TransformControls.js';

const canvas = document.getElementById('viewport');
const statusText = document.getElementById('statusText');
const addCubeBtn = document.getElementById('addCubeBtn');
const deleteBtn = document.getElementById('deleteBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const colorBtn = document.getElementById('colorBtn');
const colorPicker = document.getElementById('colorPicker');
const moveModeBtn = document.getElementById('moveModeBtn');
const rotateModeBtn = document.getElementById('rotateModeBtn');
const scaleModeBtn = document.getElementById('scaleModeBtn');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020617);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(5, 4, 7);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambient = new THREE.HemisphereLight(0xffffff, 0x334155, 1.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(6, 9, 5);
scene.add(sun);

const grid = new THREE.GridHelper(40, 40, 0x38bdf8, 0x334155);
scene.add(grid);

const transform = new TransformControls(camera, renderer.domElement);
transform.setMode('translate');
transform.setSize(0.9);
scene.add(transform);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const objects = [];
let selected = null;
let angleX = 0.75;
let angleY = 0.55;
let distance = 9;
let dragging = false;
let lastX = 0;
let lastY = 0;
let dragBlocked = false;
let pinchStart = 0;
let pinchDistance = distance;

function setStatus(text) {
  statusText.textContent = text;
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function updateCamera() {
  const x = Math.cos(angleX) * Math.cos(angleY) * distance;
  const y = Math.sin(angleY) * distance;
  const z = Math.sin(angleX) * Math.cos(angleY) * distance;
  camera.position.set(x, y, z);
  camera.lookAt(0, 0.7, 0);
}

function makeCube(position) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: colorPicker.value, roughness: 0.6 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.copy(position || new THREE.Vector3((objects.length % 4) - 1.5, 0.5, Math.floor(objects.length / 4)));
  cube.userData.name = 'Cubo ' + (objects.length + 1);
  scene.add(cube);
  objects.push(cube);
  selectObject(cube);
  setStatus(cube.userData.name + ' agregado');
}

function selectObject(object) {
  selected = object;
  if (selected) {
    transform.attach(selected);
    setStatus('Seleccionado: ' + selected.userData.name);
  } else {
    transform.detach();
  }
}

function screenToPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pick(event) {
  screenToPointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(objects, false);
  if (hits.length) selectObject(hits[0].object);
}

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function setMode(mode) {
  transform.setMode(mode);
  moveModeBtn.classList.toggle('active', mode === 'translate');
  rotateModeBtn.classList.toggle('active', mode === 'rotate');
  scaleModeBtn.classList.toggle('active', mode === 'scale');
  const names = { translate: 'Mover', rotate: 'Rotar', scale: 'Escalar' };
  setStatus('Gizmo: ' + names[mode]);
}

transform.addEventListener('dragging-changed', (event) => {
  dragBlocked = event.value;
});

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  pick(event);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging || dragBlocked) return;
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  lastX = event.clientX;
  lastY = event.clientY;
  angleX += dx * 0.008;
  angleY += dy * 0.008;
  angleY = Math.max(-1.1, Math.min(1.2, angleY));
  updateCamera();
});

window.addEventListener('pointerup', () => {
  dragging = false;
});

canvas.addEventListener('touchstart', (event) => {
  if (event.touches.length === 2) {
    pinchStart = getTouchDistance(event.touches);
    pinchDistance = distance;
  }
}, { passive: true });

canvas.addEventListener('touchmove', (event) => {
  if (event.touches.length === 2 && pinchStart > 0) {
    event.preventDefault();
    const current = getTouchDistance(event.touches);
    distance = Math.max(3, Math.min(24, pinchDistance * (pinchStart / current)));
    updateCamera();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  pinchStart = 0;
}, { passive: true });

addCubeBtn.onclick = () => makeCube();

duplicateBtn.onclick = () => {
  if (!selected) return setStatus('Selecciona un cubo');
  const pos = selected.position.clone().add(new THREE.Vector3(1.2, 0, 0));
  makeCube(pos);
  if (selected) selected.material.color.set(colorPicker.value);
};

deleteBtn.onclick = () => {
  if (!selected) return setStatus('No hay cubo seleccionado');
  transform.detach();
  scene.remove(selected);
  const index = objects.indexOf(selected);
  if (index >= 0) objects.splice(index, 1);
  selected = null;
  setStatus('Cubo eliminado');
};

colorBtn.onclick = () => {
  if (!selected) return setStatus('Selecciona un cubo');
  selected.material.color.set(colorPicker.value);
  setStatus('Color aplicado');
};

moveModeBtn.onclick = () => setMode('translate');
rotateModeBtn.onclick = () => setMode('rotate');
scaleModeBtn.onclick = () => setMode('scale');

function loop() {
  resize();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

updateCamera();
makeCube();
loop();
