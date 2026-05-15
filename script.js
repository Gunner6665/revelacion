// ============================================================
//  ENVIO DE CORREO CON EMAILJS 
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    emailjs.init("EYdnr2v63lN1la-8d");

    const btnConfirmar = document.getElementById('confirmBtn');

    btnConfirmar?.addEventListener('click', () => {
        const nombre = prompt("Por favor, ingresa tu nombre completo para confirmar tu asistencia:");
        if (nombre !== null && nombre.trim() !== "") {
            const templateParams = {
                message: nombre + " confirmó asistencia a la revelación de género 🎉"
            };
            emailjs.send(
                "service_owk9la7",
                "template_bbhzefd",
                templateParams
            )
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
});

// ============================================================
//  CONFIGURACIÓN DE FIREBASE PARA GUARDAR DEDICATORIAS Y FOTOS
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore, addDoc, collection } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

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
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {

    // 1. Lógica para Redirigir desde pageb.html
    const btnNino = document.querySelector('.ninos');
    const btnNina = document.querySelector('.ninas');

    if (btnNino) btnNino.onclick = () => window.location.href = "pagec.html";
    if (btnNina) btnNina.onclick = () => window.location.href = "pagec.html";

    // 2. Lógica para la Cámara (pagec.html)
    const cameraInput = document.getElementById('cameraInput');
    const photoPreview = document.getElementById('photoPreview');
    let fotoFile = null;

    if (cameraInput) {
        cameraInput.addEventListener('change', (e) => {
            fotoFile = e.target.files[0];
            if (fotoFile) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    photoPreview.innerHTML = `<img src="${f.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                reader.readAsDataURL(fotoFile);
            }
        });
    }

    // 3. Enviar datos a Firebase
    const form = document.getElementById('dedicatoriaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('button');
            btn.innerText = "Enviando...";
            btn.disabled = true;

            try {
                let fotoUrl = "";

                // Subir foto si existe
                if (fotoFile) {
                    const storageRef = ref(storage, `selfies/${Date.now()}_${fotoFile.name}`);
                    await uploadBytes(storageRef, fotoFile);
                    fotoUrl = await getDownloadURL(storageRef);
                }

                // Guardar en Firestore
                await addDoc(collection(db, "dedicatorias"), {
                    nombre: document.getElementById('nombre').value,
                    parentesco: document.getElementById('parentesco').value,
                    mensaje: document.getElementById('mensaje').value,
                    foto: fotoUrl,
                    fecha: new Date()
                });

                alert("¡Gracias! Tu dedicatoria se guardó correctamente. ✨");
                window.location.href = "index.html"; // Regresar al inicio

            } catch (error) {
                console.error("Error:", error);
                alert("Hubo un problema al enviar.");
                btn.innerText = "Enviar Dedicatoria";
                btn.disabled = false;
            }
        });
    }
});

// ============================================================
//  MÓDULO: PAGEB — Selección de Team
// ============================================================
class PaginaTeam {
    constructor() {
        const btnNino = document.getElementById('btnNino');
        const btnNina = document.getElementById('btnNina');
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
//  MÓDULO: PAGEC — Captura y Envío de Dedicatoria
// ============================================================
class FormularioDedicatoria {
    constructor(db, storage) {
        this.db = db;
        this.storage = storage;
        this.form = document.getElementById('dedicatoriaForm');
        this.cameraInput = document.getElementById('cameraInput');
        this.preview = document.getElementById('photoPreview');
        this.placeholder = document.getElementById('placeholderText');
        this.selectedFile = null;

        if (this.form) {
            this.init();
        }
    }

    init() {
        this.cameraInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.selectedFile = file;
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.preview.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = this.form.querySelector('button[type="submit"]');
            btn.innerText = "Subiendo...";
            btn.disabled = true;

            try {
                let fotoUrl = "";
                if (this.selectedFile) {
                    const storageRef = ref(this.storage, `selfies/${Date.now()}_${this.selectedFile.name}`);
                    const snapshot = await uploadBytes(storageRef, this.selectedFile);
                    fotoUrl = await getDownloadURL(snapshot.ref);
                }

                // Obtenemos el equipo guardado en memoria local
                const teamAsignado = localStorage.getItem('selectedTeam') || 'no-definido';

                // Guardar documento estructurado completo
                await addDoc(collection(this.db, "dedicatorias"), {
                    nombre: document.getElementById('nombre').value,
                    parentesco: document.getElementById('parentesco').value,
                    mensaje: document.getElementById('mensaje').value,
                    foto: fotoUrl,
                    team: teamAsignado,
                    fecha: new Date()
                });

                alert("¡Gracias! Tu dedicatoria se guardó correctamente. ✨");
                window.location.href = "paged.html";

            } catch (error) {
                console.error("Error en el envío:", error);
                alert("Hubo un problema al enviar.");
                btn.innerText = "Enviar Dedicatoria";
                btn.disabled = false;
            }
        });
    }
}

// ============================================================
//  MÓDULO: PAGED — Renderizado Dinámico del Árbol y Modal (POO)
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

            // Remover elefantitos viejos para evitar duplicados en actualizaciones
            this.container.querySelectorAll('.avatar-leaf').forEach(el => el.remove());

            snapshot.docs.forEach((doc, index) => {
                const data = doc.data();

                if (data.team === 'nina') contNina++;
                if (data.team === 'nino') contNino++;

                this.crearElefanteEnArbol(data, index);
            });

            // Actualizar contadores globales de la interfaz
            document.getElementById('cntNina').innerText = contNina;
            document.getElementById('cntNino').innerText = contNino;
            document.getElementById('cntTotal').innerText = snapshot.size;
        }); this.closeBtn.addEventListener('click', () => {
            this.overlay.classList.remove('active');
        });

        document.getElementById('btnRevelar')?.addEventListener('click', () => {
            alert("🎉 ¡ES UNA HERMOSA NIÑA! 👶💖");
            // Nota: Aquí puedes cambiar el mensaje o lógica según el resultado real
        });
    } crearElefanteEnArbol(data, index) {
        const leaf = document.createElement('div');
        leaf.className = 'avatar-leaf';

        // Algoritmo matemático distributivo semi-aleatorio controlado para dispersar 
        // los elefantitos en las zonas altas y medias del árbol (Ramas)
        const seedX = Math.sin(index + 1) * 35 + 50; // Rango de 15% a 85% horizontal
        const seedY = Math.cos(index * 2) * 25 + 35; // Rango de 10% a 60% vertical (Zona de copa)

        leaf.style.left = `${seedX}%`; leaf.style.top = `${seedY}%`;

        // Selección de avatar según el equipo del usuario
        const avatarImg = data.team === 'nina' ? 'elefanta.png' : 'elefante.png';

        leaf.innerHTML = `            <img src="${avatarImg}" alt="huella">
            <span class="leaf-name">${data.nombre.split(' ')[0]}</span>
        `;

        // Evento interactivo para abrir el Modal y volcar los datos específicos
        leaf.addEventListener('click', () => this.abrirModalDetalle(data));

        this.container.appendChild(leaf);
    }

    abrirModalDetalle(data) {
        const avatarWrap = document.getElementById('modalAvatarWrap');
        const teamTag = document.getElementById('modalTeamTag');

        // Si el usuario subió selfie se muestra, si no, se muestra el elefante del team por defecto
        if (data.foto) {
            avatarWrap.innerHTML = `<img src="${data.foto}" class="modal-avatar-img">`;
        } else {
            const defAvatar = data.team === 'nina' ? 'elefanta.png' : 'elefante.png';
            avatarWrap.innerHTML = `<img src="${defAvatar}" class="modal-avatar-img" style="object-fit: contain;">`;
        }

        document.getElementById('modalName').innerText = data.nombre;

        if (data.team === 'nina') {
            teamTag.innerText = "TEAM NIÑA";
            teamTag.className = "modal-team-tag nina";
        } else {
            teamTag.innerText = "TEAM NIÑO";
            teamTag.className = "modal-team-tag nino";
        }

        document.getElementById('modalFamiliarity').innerText = `Parentesco: ${data.parentesco}`;
        document.getElementById('modalDedication').innerText = `"${data.mensaje}"`;

        this.overlay.classList.add('active');
    }
}

// ============================================================
//  INICIALIZACIÓN DE INSTANCIAS DEL PROYECTO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    new PaginaTeam();
    new FormularioDedicatoria(db, storage);
    new ArbolRevelacion(db);
});