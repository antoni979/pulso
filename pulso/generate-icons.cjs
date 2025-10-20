// Script simple para generar iconos PNG desde canvas
const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fondo con gradiente
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#8b5cf6');
  gradient.addColorStop(0.5, '#ec4899');
  gradient.addColorStop(1, '#f97316');

  // Esquinas redondeadas
  const radius = size * 0.225; // ~115px para 512px
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // Línea de pulso blanca
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size * 0.023; // ~12px para 512px
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const centerY = size * 0.55;
  const scale = size / 512;

  ctx.beginPath();
  ctx.moveTo(100 * scale, centerY);
  ctx.lineTo(150 * scale, centerY - 80 * scale);
  ctx.lineTo(200 * scale, centerY + 20 * scale);
  ctx.lineTo(250 * scale, centerY - 120 * scale);
  ctx.lineTo(300 * scale, centerY);
  ctx.lineTo(350 * scale, centerY - 40 * scale);
  ctx.lineTo(400 * scale, centerY);
  ctx.stroke();

  // Punto circular
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.75, size * 0.023, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Texto PULSO
  ctx.font = `bold ${size * 0.16}px Arial, sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PULSO', size / 2, size * 0.90);

  // Guardar
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Generated ${filename}`);
}

try {
  generateIcon(192, 'public/icon-192x192.png');
  generateIcon(512, 'public/icon-512x512.png');
  generateIcon(512, 'public/maskable-icon.png');
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('\nCanvas module not available. Installing...');
}
