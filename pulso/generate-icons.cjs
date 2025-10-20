// Script para generar iconos PNG minimalistas desde canvas
const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fondo minimalista con gradiente sutil oscuro
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0f172a');  // Slate-900
  gradient.addColorStop(1, '#1e293b');  // Slate-800

  // Esquinas redondeadas
  const radius = size * 0.225;
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

  // Línea de pulso verde esmeralda minimalista
  const scale = size / 512;
  const centerY = size * 0.5;
  const lineWidth = size * 0.012;

  ctx.strokeStyle = '#10b981';  // Verde esmeralda
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Línea izquierda
  ctx.beginPath();
  ctx.moveTo(80 * scale, centerY);
  ctx.lineTo(140 * scale, centerY);
  ctx.stroke();

  // Pulso (electrocardiograma minimalista)
  ctx.beginPath();
  ctx.moveTo(140 * scale, centerY);
  ctx.lineTo(160 * scale, centerY);
  ctx.lineTo(170 * scale, centerY - 120 * scale);
  ctx.lineTo(185 * scale, centerY + 160 * scale);
  ctx.lineTo(200 * scale, centerY - 80 * scale);
  ctx.lineTo(215 * scale, centerY + 40 * scale);
  ctx.lineTo(230 * scale, centerY - 60 * scale);
  ctx.lineTo(245 * scale, centerY);
  ctx.lineTo(300 * scale, centerY);
  ctx.stroke();

  // Línea derecha
  ctx.beginPath();
  ctx.moveTo(300 * scale, centerY);
  ctx.lineTo(360 * scale, centerY);
  ctx.stroke();

  // Punto final (círculo pequeño)
  ctx.beginPath();
  ctx.arc(360 * scale, centerY, size * 0.008, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();

  // Texto PULSO (sans-serif, light weight, espaciado)
  ctx.font = `300 ${size * 0.10}px system-ui, sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PULSO', size / 2, size * 0.74);

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
}
