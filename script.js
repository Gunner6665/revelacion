// ============================================================
//   CONFIGURACIÓN DE FIREBASE PARA GUARDAR DEDICATORIAS
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, addDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAjRgfWEldUVm55w89FHTxykxUihxj2bGQ",
    authDomain: "revelacion-gunner6665.firebaseapp.com",
    projectId: "revelacion-gunner6665",
    storageBucket: "revelacion-gunner6665.firebasestorage.app",
    messagingSenderId: "679520672693",
    appId: "1:679520672693:web:9147f4ac45541a38a4d7fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
//  MÓDULO: PAGEB — Selección de Team
// ============================================================
class PaginaTeam {
    constructor() {
        const btnNino = document.querySelector('.ninos') || document.getElementById('btnNino');
        const btnNina = document.querySelector('.ninas') || document.getElementById('btnNina');
        if (!btnNino && !btnNina) return;

        btnNino?.addEventListener('click', () => {
            localStorage.setItem('selectedTeam', 'nino');
            window.location.href = 'pagec.html';
        });
        btnNina?.addEventListener('click', () => {
            localStorage.setItem('selectedTeam', 'nina');
            window.location.href = 'pagec.html';
        });
    }
}

// ============================================================
//  MÓDULO: PAGEC — Captura y Envío de Dedicatoria (CON COMPRESIÓN)
// ============================================================
class FormularioDedicatoria {
    constructor(db) {
        this.db = db;
        this.form = document.getElementById('dedicatoriaForm');
        this.cameraInput = document.getElementById('cameraInput');
        this.preview = document.getElementById('photoPreview');
        this.fotoBase64 = ""; 

        if (this.form) {
            this.init();
        }
    }

    init() {
        if (this.cameraInput) {
            this.cameraInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.src = event.target.result;

                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            const MAX_WIDTH = 400;
                            const MAX_HEIGHT = 400;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;

                            ctx.drawImage(img, 0, 0, width, height);

                            this.fotoBase64 = canvas.toDataURL('image/jpeg', 0.6);

                            this.preview.innerHTML = `<img src="${this.fotoBase64}" style="width:100%; height:100%; object-fit:cover;">`;
                        };
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = this.form.querySelector('button[type="submit"]') || this.form.querySelector('button');
            btn.innerText = "Enviando...";
            btn.disabled = true;

            try {
                let fotoFinal = this.fotoBase64 || "https://cdn-icons-png.flaticon.com/512/3069/3069172.png";

                const teamAsignado = localStorage.getItem('selectedTeam') || 'nino';

                await addDoc(collection(this.db, "dedicatorias"), {
                    nombre: document.getElementById('nombre').value,
                    parentesco: document.getElementById('parentesco').value,
                    mensaje: document.getElementById('mensaje').value,
                    foto: fotoFinal,
                    team: teamAsignado,
                    fecha: new Date()
                });

                localStorage.removeItem('selectedTeam');

                showModal({
                    icon: '✨',
                    title: '¡Gracias!',
                    msg: 'Tu dedicatoria se guardó correctamente y ya está en el árbol de la revelación.',
                    btnLabel: '💛 Ver el árbol',
                    btnStyle: 'gold',
                    onClose: () => { window.location.href = "paged.html"; }
                });

            } catch (error) {
                console.error("Error en el envío desde el dispositivo:", error);
                showModal({
                    icon: '😔',
                    title: 'Ups...',
                    msg: 'Hubo un problema al enviar tu dedicatoria. Por favor intenta de nuevo.',
                    btnLabel: 'Intentar de nuevo',
                    btnStyle: 'ghost',
                    onClose: () => {
                        btn.innerText = "Enviar Dedicatoria";
                        btn.disabled = false;
                    }
                });
            }
        });
    }
}

// ============================================================
//  MÓDULO: PAGED — Renderizado Dinámico del Árbol y Modal
// ============================================================
class ArbolRevelacion {
    constructor(db) {
        this.db = db;
        this.container = document.getElementById('treeContainer');
        this.overlay = document.getElementById('modalOverlay');
        this.closeBtn = document.getElementById('modalCloseBtn');

        if (!this.container) return;
        this.init();
    }

    init() {
        // Escucha en tiempo real de Firebase Cloud Firestore
        onSnapshot(collection(this.db, "dedicatorias"), (snapshot) => {
            let contNina = 0;
            let contNino = 0;

            // Remover elefantitos viejos para evitar duplicados
            this.container.querySelectorAll('.avatar-leaf').forEach(el => el.remove());

            snapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                const teamNormalizado = (data.team || '').toLowerCase();

                if (teamNormalizado === 'nina' || teamNormalizado.includes('niña')) contNina++;
                if (teamNormalizado === 'nino' || teamNormalizado.includes('niño')) contNino++;

                this.crearElefanteEnArbol(data, index);
            });

            // Actualizar contadores globales de la interfaz
            if (document.getElementById('cntNina')) document.getElementById('cntNina').innerText = contNina;
            if (document.getElementById('cntNino')) document.getElementById('cntNino').innerText = contNino;
            if (document.getElementById('cntTotal')) document.getElementById('cntTotal').innerText = snapshot.size;
        });

        // ESCUCHA DEL BOTÓN CERRAR (Colocado exactamente aquí dentro del inicio del árbol)
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.overlay.classList.remove('active');
            });
        }

        document.getElementById('cajaRevelacion')?.addEventListener('click', () => {
            abrirModalPassword();
        });
    }

    crearElefanteEnArbol(data, index) {
        const leaf = document.createElement('div');
        leaf.className = 'avatar-leaf';

        // Distribución en las ramas
        const seedX = Math.sin(index + 1) * 35 + 50;
        const seedY = Math.cos(index * 2) * 25 + 35;

        leaf.style.left = `${seedX}%`;
        leaf.style.top = `${seedY}%`;

        const teamNormalizado = (data.team || '').toLowerCase();
        const avatarImg = teamNormalizado === 'nina' || teamNormalizado.includes('niña') ? 'elefanta.png' : 'elefante.png';

        leaf.innerHTML = `
            <img src="${avatarImg}" alt="huella">
            <span class="leaf-name">${(data.nombre || 'Invitado').split(' ')[0]}</span>
        `;

        // Evento interactivo para abrir el Modal al hacer click en el elefante
        leaf.addEventListener('click', () => this.abrirModalDetalle(data));

        this.container.appendChild(leaf);
    }

    abrirModalDetalle(data) {
        const avatarWrap = document.getElementById('modalAvatarWrap');
        const teamTag = document.getElementById('modalTeamTag');
        const teamNormalizado = (data.team || '').toLowerCase();

        // Si es una foto en base64 o una url real, la cargamos directo
        if (data.foto && (data.foto.startsWith('http') || data.foto.startsWith('data:image'))) {
            avatarWrap.innerHTML = `<img src="${data.foto}" class="modal-avatar-img" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            const defAvatar = teamNormalizado.includes('niña') || teamNormalizado.includes('nina') ? 'elefanta.png' : 'elefante.png';
            avatarWrap.innerHTML = `<img src="${defAvatar}" class="modal-avatar-img" style="object-fit: contain;">`;
        }

        document.getElementById('modalNombre').innerText = data.nombre;

        if (teamNormalizado.includes('niña') || teamNormalizado.includes('nina')) {
            teamTag.innerText = "TEAM NIÑA";
            teamTag.className = "modal-team-tag nina";
        } else {
            teamTag.innerText = "TEAM NIÑO";
            teamTag.className = "modal-team-tag nino";
        }

        document.getElementById('modalParentesco').innerText = `Parentesco: ${data.parentesco || 'Invitado'}`;
        document.getElementById('modalMensaje').innerText = `"${data.mensaje}"`;

        // Activa el modal quitando cualquier restricción oculta del CSS
        this.overlay.classList.add('active');
    }
}

// ============================================================
//  SISTEMA DE MODALES CUSTOM (reemplaza alert())
// ============================================================
function showModal({ icon, title, msg, btnLabel, btnStyle = 'gold', onClose }) {
    const existing = document.getElementById('customModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'custom-modal-overlay';

    overlay.innerHTML = `
        <div class="custom-modal-box">
            <span class="custom-modal-icon">${icon}</span>
            <div class="custom-modal-title">${title}</div>
            <p class="custom-modal-msg">${msg}</p>
            <button class="custom-modal-btn ${btnStyle}" id="customModalBtn">${btnLabel}</button>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.querySelector('#customModalBtn').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
            if (onClose) onClose();
        }, 300);
    });
}

function abrirModalPassword() {
    const modal = document.getElementById('modalPassword');
    const input = document.getElementById('inputPassword');
    const error = document.getElementById('passwordError');
    if (!modal) return;

    input.value = '';
    error.style.display = 'none';
    modal.classList.add('active');
    setTimeout(() => input.focus(), 300);

    // Botón cancelar
    document.getElementById('btnCancelarPassword').onclick = () => {
        modal.classList.remove('active');
    };

    // Botón confirmar
    document.getElementById('btnConfirmarPassword').onclick = () => verificarPassword();

    // Enter en el input
    input.onkeydown = (e) => { if (e.key === 'Enter') verificarPassword(); };
}

function verificarPassword() {
    const input = document.getElementById('inputPassword');
    const error = document.getElementById('passwordError');
    const CLAVE = 'Gian372nco';

    if (input.value === CLAVE) {
        document.getElementById('modalPassword').classList.remove('active');
        iniciarAnimacionEpica();
    } else {
        error.style.display = 'block';
        input.value = '';
        input.style.borderColor = '#ff6b8a';
        input.style.boxShadow = '0 0 12px rgba(255,107,138,0.6)';
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }, 1200);
        input.focus();
    }
}

function iniciarAnimacionEpica() {
    const cajaImg = document.getElementById('cajaImg');
    const overlay = document.getElementById('animacionEpica');
    const caja2 = document.getElementById('cajaAbiertaEpica');
    const brillo = document.getElementById('brilloExplosion');
    const humo = document.getElementById('humoMagico');
    const canvas = document.getElementById('confettiCanvas');

    // 1. Temblor en la caja cerrada
    cajaImg.classList.add('temblando');

    setTimeout(() => {
        cajaImg.classList.remove('temblando');

        // 2. Oscurecer pantalla y mostrar overlay épico
        overlay.classList.add('activa');

        // 3. Explosión de brillo
        brillo.classList.add('explotar');
        humo.classList.add('activo');

        // 4. Lanzar confeti
        lanzarConfeti(canvas);

        // 5. Mostrar caja abierta con animación
        setTimeout(() => {
            caja2.classList.add('visible');
        }, 200);

        // 6. Después de 3.5 segundos, mostrar modal revelación
        setTimeout(() => {
            overlay.classList.remove('activa');
            brillo.classList.remove('explotar');
            humo.classList.remove('activo');
            caja2.classList.remove('visible');
            showRevealModal();
        }, 3500);

    }, 900);
}

function lanzarConfeti(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORES = [
        '#ff9dd0', '#ff69b4', '#ff1493',  // rosas
        '#9de4ff', '#00bfff', '#1e90ff',  // azules
        '#ffd700', '#ffec6e', '#fff9c4',  // dorados
        '#ffffff', '#c084fc', '#f0abfc',  // blancos/morados
    ];

    const particulas = [];
    const TOTAL = 220;

    for (let i = 0; i < TOTAL; i++) {
        particulas.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 100,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18 - 8,
            size: Math.random() * 10 + 4,
            color: COLORES[Math.floor(Math.random() * COLORES.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 8,
            gravity: 0.25 + Math.random() * 0.2,
            alpha: 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
        });
    }

    let frame = 0;
    const MAX_FRAMES = 180;

    function dibujar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.99;
            p.rotation += p.rotSpeed;
            p.alpha = Math.max(0, 1 - frame / MAX_FRAMES);

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;

            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            }
            ctx.restore();
        });

        frame++;
        if (frame < MAX_FRAMES) requestAnimationFrame(dibujar);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    dibujar();
}

function showRevealModal() {
    const existing = document.getElementById('customModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'custom-modal-overlay';

    overlay.innerHTML = `
        <div class="custom-modal-box">
            <img src="elefanta.png" style="width:120px; height:120px; object-fit:contain; display:block; margin: 24px auto 0;">
            <div class="custom-modal-reveal-title">¡Es una Niña!</div>
            <p class="custom-modal-msg">💖 ¡El bebé es una hermosa niña! El Team Niña tenía razón. ¡Felicidades a todos!</p>
            <button class="custom-modal-btn pink" id="customModalBtn">💕 ¡Qué emoción!</button>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.querySelector('#customModalBtn').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    });
}

/*function showRevealModal() {
    const existing = document.getElementById('customModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'customModalOverlay';
    overlay.className = 'custom-modal-overlay';

    overlay.innerHTML = `
        <div class="custom-modal-box">
            <img src="elefante.png" style="width:120px; height:120px; object-fit:contain; display:block; margin: 24px auto 0;">
            <div class="custom-modal-reveal-title" style="text-shadow: 0 0 10px rgba(0,191,255,0.9), 0 0 25px rgba(30,144,255,0.7);">¡Es un Niño!</div>
            <p class="custom-modal-msg">💙 ¡El bebé es un hermoso niño! El Team Niño tenía razón. ¡Felicidades a todos!</p>
            <button class="custom-modal-btn blue" id="customModalBtn">🎉 ¡Qué emoción!</button>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.querySelector('#customModalBtn').addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    });
}*/




// ============================================================
//  INICIALIZACIÓN DE INSTANCIAS DEL PROYECTO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa Selección de Team (pageb.html)
    new PaginaTeam();

    // 2. Inicializa Formulario (pagec.html) - CORREGIDO: Ya no le pasa "storage" que causaba error
    if (document.getElementById('dedicatoriaForm')) {
        new FormularioDedicatoria(db);
    }

    // 3. Inicializa el Árbol (paged.html)
    if (document.getElementById('treeContainer')) {
        new ArbolRevelacion(db);
    }
});