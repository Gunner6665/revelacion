// ============================================================
//  ENVIO DE CORREO CON EMAILJS 
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined' && document.getElementById('confirmBtn')) {
        emailjs.init("EYdnr2v63lN1la-8d");

        const btnConfirmar = document.getElementById('confirmBtn');
        btnConfirmar.addEventListener('click', () => {
            const nombre = prompt("Por favor, ingresa tu nombre completo para confirmar tu asistencia:");
            if (nombre !== null && nombre.trim() !== "") {
                const templateParams = {
                    message: nombre + " confirmó asistencia a la revelación de género 🎉"
                };
                emailjs.send("service_owk9la7", "template_bbhzefd", templateParams)
                    .then(function (response) {
                        alert("¡Muchas gracias " + nombre + "!\n\nTu asistencia fue confirmada correctamente 🎉");
                        window.location.href = "pageb.html";
                        console.log("Correo enviado", response);
                    })
                    .catch(function (error) {
                        alert("Error enviando correo");
                        console.log(error);
                    });
            } else if (nombre === "") {
                alert("Debes ingresar un nombre");
            }
        });
    }
});

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
        this.fotoBase64 = ""; // Guardaremos la imagen optimizada aquí

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
                            // --- PROCESO DE COMPRESIÓN ULTRA-RÁPIDA ---
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            // Definimos un tamaño máximo ideal para el avatar del modal
                            const MAX_WIDTH = 400;
                            const MAX_HEIGHT = 400;
                            let width = img.width;
                            let height = img.height;

                            // Mantenemos la proporción original de la foto
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

                            // Dibujamos la foto en el lienzo pequeño
                            ctx.drawImage(img, 0, 0, width, height);

                            // Convertimos a Base64 reduciendo la calidad al 60% (pesa poquísimo y se ve genial)
                            this.fotoBase64 = canvas.toDataURL('image/jpeg', 0.6);

                            // Mostramos la previsualización en el recuadro
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
                // Si no hay selfie, se usa la silueta por defecto
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

                alert("¡Gracias! Tu dedicatoria se guardó correctamente. ✨");
                window.location.href = "paged.html";

            } catch (error) {
                console.error("Error en el envío desde el dispositivo:", error);
                alert("Hubo un problema al enviar.");
                btn.innerText = "Enviar Dedicatoria";
                btn.disabled = false;
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

        document.getElementById('btnRevelar')?.addEventListener('click', () => {
            alert("🎉 ¡ES UNA HERMOSA NIÑA! 👶💖");
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