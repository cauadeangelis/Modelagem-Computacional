// Região 1 (v16): o número da rota (1ª … 9ª, 10º) flutua em cima de cada casa e do Silo, para a professora
// saber aonde ir. Amarelo e pulando = a próxima; verde com ✓ = já vencida; cinza com cadeado = ainda fechada.
import * as THREE from 'three';
import { G } from '../jogo.js';
import { naRota, proximaDaRota } from '../dados/regiao-1.js';

const texturas = new Map();
function textura(rotulo, estado) {
  const k = rotulo + estado;
  if (texturas.has(k)) return texturas.get(k);
  const c = document.createElement('canvas'); c.width = 160; c.height = 160;
  const g = c.getContext('2d');
  const fundo = estado === 'feita' ? '#d5eee4' : estado === 'agora' ? '#ffd34d' : '#cfc6b4';
  g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(80, 80, 74, 0, Math.PI * 2); g.fill();
  g.fillStyle = fundo; g.beginPath(); g.arc(80, 80, 64, 0, Math.PI * 2); g.fill();
  g.fillStyle = estado === 'feita' ? '#2e8b3a' : '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${estado === 'feita' ? 76 : 58}px Fredoka, system-ui, sans-serif`;
  g.fillText(estado === 'feita' ? '✓' : rotulo, 80, 86);
  if (estado === 'trava') { g.font = '40px system-ui'; g.fillText('🔒', 126, 30); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  texturas.set(k, t);
  return t;
}

// cria (uma vez) e atualiza as marcas de uma vila ou do Silo da região 1
export function marcasDaRota(S) {
  if (S.def.regiao !== 1 || !G.scene) return;
  const p = G.progress, prox = proximaDaRota(p);
  for (const [nivel, B] of Object.entries(S.buildings)) {
    const r = naRota(S.def.id, nivel);
    if (!r || !B) continue;
    const estado = p.won(r.chave) ? 'feita' : prox && prox.chave === r.chave ? 'agora' : 'trava';
    if (!B.ordem) {
      const mat = new THREE.SpriteMaterial({ map: textura(r.rotulo, estado), depthTest: false, transparent: true });
      const sp = new THREE.Sprite(mat); sp.renderOrder = 20;
      const altura = nivel === 'B' ? 6.5 : (B.H || 3) * (B.scale || 1) + 3.2;
      sp.position.set(B.x, (B.y || 0) + altura, B.z); sp.userData.base = sp.position.y;
      G.scene.add(sp);
      B.ordem = sp;
      S.updaters.push((t) => { const s = B.ordem; if (!s) return; const on = s.userData.estado === 'agora'; s.position.y = s.userData.base + (on ? Math.abs(Math.sin(t * 3)) * 0.5 : 0); const k = on ? 2.2 + Math.sin(t * 6) * 0.12 : 1.7; s.scale.set(k, k, 1); });
    }
    B.ordem.userData.estado = estado;
    B.ordem.material.map = textura(r.rotulo, estado);
    B.ordem.material.needsUpdate = true;
  }
}
// depois de vencer uma casa, a próxima da rota (que pode estar em outra vila) muda de cor
export function atualizarRota() { for (const S of G.settlements || []) if (S.def.regiao === 1) marcasDaRota(S); }
