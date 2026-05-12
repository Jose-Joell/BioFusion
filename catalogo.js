// ── Bio Fusión – Catálogo Dinámico ──
// Lee los productos de data/productos en GitHub y los renderiza en la página.

const GITHUB_USER = 'Jose-Joell';
const GITHUB_REPO = 'BioFusion';
const PRODUCTOS_PATH = 'data/productos';
const WHATSAPP = '18091234567';

const BADGE_COLORS = {
  dorado: '#c9a84c',
  verde: '#4a6741',
  'verde-oscuro': '#2e4028'
};

// Parsea el frontmatter YAML de un archivo .md
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const data = {};
  const lines = yaml.split('\n');
  let currentKey = null;

  lines.forEach(line => {
    // Si la línea empieza con espacios y hay una clave activa, es continuación
    if (line.match(/^\s+/) && currentKey) {
      data[currentKey] += ' ' + line.trim();
      return;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) {
      data[key] = value;
      currentKey = key;
    }
  });
  return data;
}

// Genera el HTML de una tarjeta de producto
function crearTarjeta(producto) {
  const waText = encodeURIComponent(`Hola, me interesa el producto: ${producto.nombre}`);
  const waLink = `https://wa.me/${WHATSAPP}?text=${waText}`;

  const badgeColor = BADGE_COLORS[producto.badge_color] || BADGE_COLORS.dorado;
  const badgeHTML = producto.badge
    ? `<span class="producto-badge" style="background:${badgeColor}">${producto.badge}</span>`
    : '';

  const imagenHTML = producto.imagen && producto.imagen.trim() !== ''
    ? `<img src="${producto.imagen}" alt="${producto.nombre}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div class="producto-img-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Foto del producto</span>
      </div>`;

  const waSVG = `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="white" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

  return `
    <div class="producto-card reveal">
      <div class="producto-img">
        ${imagenHTML}
        ${badgeHTML}
      </div>
      <div class="producto-info">
        <p class="producto-categoria">${producto.categoria || ''}</p>
        <h3 class="producto-nombre">${producto.nombre || ''}</h3>
        <p class="producto-desc">${producto.descripcion || ''}</p>
        <div class="producto-footer">
          <span class="producto-precio">${producto.precio || 'Consultar'}</span>
          <a href="${waLink}" class="btn-whatsapp" target="_blank">
            ${waSVG} Pedir
          </a>
        </div>
      </div>
    </div>`;
}

// Carga los productos desde GitHub y renderiza el catálogo
async function cargarCatalogo() {
  const grid = document.getElementById('catalogo-grid-dinamico');
  if (!grid) return;

  try {
    // Obtiene la lista de archivos de la carpeta
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${PRODUCTOS_PATH}`
    );

    if (!res.ok) throw new Error('No se pudo cargar el catálogo');
    const archivos = await res.json();

    // Filtra solo archivos .md
    const mds = archivos.filter(f => f.name.endsWith('.md'));

    if (mds.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:var(--texto-suave);grid-column:1/-1">No hay productos disponibles aún.</p>';
      return;
    }

    // Descarga el contenido de cada archivo en paralelo
    const contenidos = await Promise.all(
      mds.map(f => fetch(f.download_url).then(r => r.text()))
    );

    // Parsea y renderiza
    const tarjetas = contenidos
      .map(texto => parseFrontmatter(texto))
      .filter(p => p.nombre)
      .map(p => crearTarjeta(p))
      .join('');

    grid.innerHTML = tarjetas;

    // Activa el scroll reveal para las nuevas tarjetas
    const reveals = grid.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));

  } catch (err) {
    console.error('Error cargando catálogo:', err);
    grid.innerHTML = '<p style="text-align:center;color:var(--texto-suave);grid-column:1/-1">Error cargando productos. Intenta recargar la página.</p>';
  }
}

// Ejecuta cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarCatalogo);
