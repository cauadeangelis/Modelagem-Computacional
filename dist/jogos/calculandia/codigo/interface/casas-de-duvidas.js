// Casa de Dúvidas: apoio pedagógico da região (conceitos, erros comuns e exemplos comentados).
// Abre no mundo (prédio amarelo) e dentro da questão (botão Conceito), sem abandonar a tentativa.
// É consulta: não gasta sementes, energia nem estrelas. As dicas que revelam passos ficam separadas.
import { FERRAMENTAS, CONCEITOS, REGIAO_CONCEITO } from '../dados/conhecimento.js';
import { REGIONS } from '../dados/regioes-e-cidades.js';
import { icone, ICONES } from './icones.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function cartao(id, f, aberto) {
  return `<details class="dv-card" ${aberto ? 'open' : ''}><summary>${icone(id)}<b>${esc(f.nome)}</b><small>${esc(f.funcao)}</small></summary>
    <dl><dt>Ideia</dt><dd>${esc(f.porque)}</dd><dt>Fórmula</dt><dd class="dv-f">${esc(f.formula)}</dd><dt>Quando usar</dt><dd>${esc(f.quando)}</dd><dt>Requisitos</dt><dd>${esc(f.requisitos)}</dd>
    <dt>Exemplo comentado</dt><dd>${esc(f.exemplo)}</dd><dt>Erros comuns</dt><dd><ul>${f.erros.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></dd></dl></details>`;
}

export function htmlDuvidas(regiao, foco = null) {
  const lista = Object.entries(FERRAMENTAS).filter(([, f]) => f.regiao === regiao);
  return `<p class="dv-intro">${esc(REGIAO_CONCEITO[regiao] || '')}</p>
    ${lista.map(([id, f]) => cartao(id, f, id === foco)).join('')}
    <h3>Instrumentos da missão</h3>
    ${['erro', 'convergencia', 'energia', 'maquina'].map((k) => `<details class="dv-card"><summary>${ICONES.carta('∑')}<b>${esc(CONCEITOS[k].nome)}</b><small>Como ler este instrumento</small></summary><p>${esc(CONCEITOS[k].funcao)}</p><p>${esc(CONCEITOS[k].exemplo)}</p></details>`).join('')}
    <p class="dv-nota">Consultar aqui não gasta sementes, energia nem estrelas. As dicas que mostram passos da missão ficam no botão Dica da fase.</p>`;
}

// host: overlay; devolve close()
export function abrirDuvidas(host, regiao, { foco = null, onClose } = {}) {
  const prev = document.activeElement;
  host.classList.remove('hidden');
  host.innerHTML = `<div class="sheet dv" role="dialog" aria-modal="true" aria-labelledby="dv-t">
    <div class="row" style="justify-content:space-between"><h2 id="dv-t">❓ Casa de Dúvidas · ${esc(REGIONS[regiao]?.nome || '')}</h2><button class="btn secondary" data-dv-close>Fechar</button></div>
    ${htmlDuvidas(regiao, foco)}</div>`;
  const close = () => { host.classList.add('hidden'); host.innerHTML = ''; host.removeEventListener('click', click); host.removeEventListener('keydown', key); prev?.focus?.(); onClose?.(); };
  const click = (e) => { if (e.target === host || e.target.closest('[data-dv-close]')) close(); };
  const key = (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); close(); } };
  host.addEventListener('click', click);
  host.addEventListener('keydown', key);
  host.querySelector('[data-dv-close]').focus();
  return close;
}
