// AD01 - Mantenimiento Automotriz
// Programación Web 1

// ===== DATOS =====
var usuarios = [
  { id: 1, nombre: "Juan Pérez", email: "juan@cliente.com", pass: "123", rol: "cliente", tel: "0991112233", activo: true },
  { id: 2, nombre: "María López", email: "maria@cliente.com", pass: "123", rol: "cliente", tel: "0984445566", activo: true },
  { id: 3, nombre: "Carlos Méndez", email: "admin@autotech.ec", pass: "admin", rol: "admin", tel: "0990001122", activo: true },
  { id: 4, nombre: "Pedro Inactivo", email: "inactivo@cliente.com", pass: "123", rol: "cliente", tel: "0977778899", activo: false }
];

var estados = ["Pendiente", "En revisión", "En proceso", "Finalizado", "Cancelado"];

var servicios = [
  "Cambio de aceite y filtros",
  "Sistema de frenos",
  "Alineación y balanceo",
  "Diagnóstico con escáner",
  "Suspensión y dirección",
  "Mantenimiento preventivo"
];

// Array de objetos con las solicitudes
var citas = [];
var usuarioActual = null;

// ===== LOCALSTORAGE =====
function cargarCitas() {
  var guardado = localStorage.getItem("citas_autotech");
  if (guardado) {
    citas = JSON.parse(guardado);
  } else {
    citas = [
      {
        id: "SOL-101", clienteEmail: "juan@cliente.com", clienteNombre: "Juan Pérez", clienteTelefono: "0991112233",
        placa: "PBX-4567", marca: "Chevrolet", modelo: "Sail", anio: 2019, kilometraje: 55000,
        servicio: "Cambio de aceite y filtros", fecha: "2026-11-20", hora: "09:00",
        prioridad: "Normal", extras: ["Lavado"], observaciones: "Revisión de rutina", estado: "En proceso"
      },
      {
        id: "SOL-102", clienteEmail: "maria@cliente.com", clienteNombre: "María López", clienteTelefono: "0984445566",
        placa: "TBA-8910", marca: "Toyota", modelo: "Hilux", anio: 2021, kilometraje: 38000,
        servicio: "Sistema de frenos", fecha: "2026-11-23", hora: "10:30",
        prioridad: "Urgente", extras: [], observaciones: "Pedal de freno bajo", estado: "Pendiente"
      }
    ];
  }
}

function guardarCitas() {
  localStorage.setItem("citas_autotech", JSON.stringify(citas));
}

// ===== VALIDACIONES =====
function validarPlaca(placa) {
  // 3 letras, guion y 3 o 4 numeros. Ejemplo: ABC-1234
  var patron = /^[A-Z]{3}-[0-9]{3,4}$/;
  return patron.test(placa);
}

function validarTelefono(tel) {
  // 10 numeros que empiezan con 09
  var patron = /^09[0-9]{8}$/;
  return patron.test(tel);
}

function validarCorreo(email) {
  var patron = /^[^ @]+@[^ @]+\.[^ @]+$/;
  return patron.test(email);
}

function validarAnio(anio) {
  var numero = parseInt(anio);
  var anioActual = new Date().getFullYear();
  if (isNaN(numero) || numero < 1990 || numero > anioActual + 1) {
    return false;
  }
  return true;
}

function validarKilometraje(km) {
  var numero = parseFloat(km);
  if (isNaN(numero) || numero <= 0) {
    return false;
  }
  return true;
}

// Devuelve un mensaje de error, o "" si todo esta bien
function validarFechaHora(fecha, hora, permitirPasado) {
  if (fecha == "") {
    return "Selecciona una fecha.";
  }
  if (hora == "") {
    return "Selecciona una hora.";
  }

  var partes = fecha.split("-");
  var dia = new Date(partes[0], partes[1] - 1, partes[2]);
  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (permitirPasado == false && dia < hoy) {
    return "La fecha no puede ser pasada.";
  }

  var diaSemana = dia.getDay(); // 0 = domingo, 6 = sabado
  if (diaSemana == 0) {
    return "El taller está cerrado los domingos.";
  }

  var h = hora.split(":");
  var minutos = parseInt(h[0]) * 60 + parseInt(h[1]);

  if (diaSemana == 6) {
    if (minutos < 510 || minutos > 780) {
      return "Los sábados el horario es de 08:30 a 13:00.";
    }
  } else {
    if (minutos < 480 || minutos > 1080) {
      return "De lunes a viernes el horario es de 08:00 a 18:00.";
    }
  }
  return "";
}

function mostrarErrores(titulo, errores) {
  var lista = "";
  for (var i = 0; i < errores.length; i++) {
    lista = lista + "<li>" + errores[i] + "</li>";
  }
  Swal.fire({ icon: "error", title: titulo, html: "<ul style='text-align:left'>" + lista + "</ul>" });
}

// ===== LOGIN =====
function iniciarSesion(email, pass) {
  var usuario = usuarios.find(function (u) {
    return u.email.toLowerCase() == email.trim().toLowerCase();
  });

  if (usuario == undefined || usuario.pass != pass) {
    Swal.fire({ icon: "error", title: "Error", text: "Correo o contraseña incorrectos." });
    return;
  }
  if (usuario.activo == false) {
    Swal.fire({ icon: "warning", title: "Cuenta deshabilitada", text: "Esta cuenta está deshabilitada." });
    return;
  }

  usuarioActual = usuario;
  document.getElementById("formLogin").reset();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalLogin")).hide();
  actualizarPagina();
  Swal.fire({ icon: "success", title: "Bienvenido " + usuario.nombre, text: "Rol: " + usuario.rol });
}

function cerrarSesion() {
  usuarioActual = null;
  actualizarPagina();
}

// ===== MOSTRAR / OCULTAR SEGUN EL ROL =====
function actualizarPagina() {
  var botonSesion = document.getElementById("contenedorSesionNav");
  var perfil = document.getElementById("perfil");
  var admin = document.getElementById("admin");
  var misCitas = document.getElementById("mis-mantenimientos");

  if (usuarioActual == null) {
    // Nadie ha iniciado sesion
    botonSesion.innerHTML = "<button class='btn btn-outline-warning btn-sm' data-bs-toggle='modal' data-bs-target='#modalLogin'>" +
      "<i class='bi bi-box-arrow-in-right'></i> Iniciar sesión</button>";
    document.getElementById("msgCuenta").classList.remove("d-none");
    perfil.classList.add("d-none");
    admin.classList.add("d-none");
    misCitas.classList.add("d-none");
    document.getElementById("formNombre").value = "";
    document.getElementById("formEmail").value = "";
    document.getElementById("formTelefono").value = "";
    document.getElementById("formNombre").readOnly = false;
    document.getElementById("formEmail").readOnly = false;
    document.getElementById("formTelefono").readOnly = false;
  } else {
    botonSesion.innerHTML = "<button class='btn btn-danger btn-sm' onclick='cerrarSesion()'>Cerrar sesión</button>";
    document.getElementById("msgCuenta").classList.add("d-none");
    perfil.classList.remove("d-none");
    misCitas.classList.remove("d-none");

    document.getElementById("perfilNombre").innerHTML = usuarioActual.nombre;
    document.getElementById("perfilEmail").innerHTML = usuarioActual.email;
    document.getElementById("perfilTelefono").innerHTML = usuarioActual.tel;

    // Datos del cliente en el formulario
    document.getElementById("formNombre").value = usuarioActual.nombre;
    document.getElementById("formEmail").value = usuarioActual.email;
    document.getElementById("formTelefono").value = usuarioActual.tel;

    if (usuarioActual.rol == "admin") {
      document.getElementById("perfilRol").innerHTML = "Administrador";
      admin.classList.remove("d-none");
      // El administrador puede registrar para otro cliente
      document.getElementById("formNombre").readOnly = false;
      document.getElementById("formEmail").readOnly = false;
      document.getElementById("formTelefono").readOnly = false;
      mostrarTablaAdmin();
    } else {
      document.getElementById("perfilRol").innerHTML = "Cliente";
      admin.classList.add("d-none");
      // El cliente solo puede registrar para si mismo
      document.getElementById("formNombre").readOnly = true;
      document.getElementById("formEmail").readOnly = true;
      document.getElementById("formTelefono").readOnly = true;
    }
  }
  mostrarMisMantenimientos();
}

// ===== TABLAS =====
function mostrarMisMantenimientos() {
  var cuerpo = document.getElementById("cuerpoMis");
  var mensaje = document.getElementById("msgMis");
  cuerpo.innerHTML = "";

  if (usuarioActual == null) {
    mensaje.innerHTML = "Inicia sesión para ver tus solicitudes.";
    return;
  }

  // filter: solo las solicitudes del usuario que inicio sesion
  var mias = citas.filter(function (c) {
    return c.clienteEmail.toLowerCase() == usuarioActual.email.toLowerCase();
  });

  if (mias.length == 0) {
    mensaje.innerHTML = "No tienes solicitudes registradas.";
  } else {
    mensaje.innerHTML = "";
  }

  mias.forEach(function (c) {
    cuerpo.innerHTML += "<tr>" +
      "<td>" + c.id + "</td>" +
      "<td>" + c.marca + " " + c.modelo + "</td>" +
      "<td>" + c.placa + "</td>" +
      "<td>" + c.servicio + "</td>" +
      "<td>" + c.fecha + " " + c.hora + "</td>" +
      "<td>" + c.estado + "</td>" +
      "</tr>";
  });
}

function mostrarTablaAdmin() {
  var cuerpo = document.getElementById("cuerpoAdmin");
  cuerpo.innerHTML = "";

  // Metricas con filter()
  document.getElementById("metricTotal").innerHTML = citas.length;
  document.getElementById("metricPendientes").innerHTML = citas.filter(function (c) { return c.estado == "Pendiente"; }).length;
  document.getElementById("metricProceso").innerHTML = citas.filter(function (c) {
    return c.estado == "En proceso" || c.estado == "En revisión";
  }).length;
  document.getElementById("metricFinalizadas").innerHTML = citas.filter(function (c) { return c.estado == "Finalizado"; }).length;

  for (var i = 0; i < citas.length; i++) {
    var c = citas[i];
    cuerpo.innerHTML += "<tr>" +
      "<td>" + c.id + "</td>" +
      "<td>" + c.clienteNombre + "<br>" + c.clienteEmail + "</td>" +
      "<td>" + c.marca + " " + c.modelo + " (" + c.placa + ")</td>" +
      "<td>" + c.servicio + "</td>" +
      "<td>" + c.fecha + " " + c.hora + "</td>" +
      "<td>" + c.estado + "</td>" +
      "<td>" +
      "<button class='btn btn-sm btn-info' title='Historial' onclick=\"verHistorial('" + c.clienteEmail + "')\"><i class='bi bi-clock-history'></i></button> " +
      "<button class='btn btn-sm btn-primary' onclick=\"abrirEdicion('" + c.id + "')\">Editar</button> " +
      "<button class='btn btn-sm btn-danger' onclick=\"eliminarCita('" + c.id + "')\">Eliminar</button>" +
      "</td>" +
      "</tr>";
  }
}

// ===== CRUD DEL ADMINISTRADOR =====
function esAdministrador() {
  if (usuarioActual == null || usuarioActual.rol != "admin") {
    Swal.fire({ icon: "error", title: "Acceso denegado", text: "Solo el administrador puede hacer esto." });
    return false;
  }
  return true;
}

function abrirEdicion(id) {
  if (esAdministrador() == false) {
    return;
  }
  var c = citas.find(function (x) { return x.id == id; });

  document.getElementById("editId").value = c.id;
  document.getElementById("editTitulo").innerHTML = c.id;
  document.getElementById("editPlaca").value = c.placa;
  document.getElementById("editMarca").value = c.marca;
  document.getElementById("editModelo").value = c.modelo;
  document.getElementById("editServicio").value = c.servicio;
  document.getElementById("editFecha").value = c.fecha;
  document.getElementById("editHora").value = c.hora;
  document.getElementById("editEstado").value = c.estado;

  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEditar")).show();
}

function guardarEdicion(evento) {
  evento.preventDefault();
  if (esAdministrador() == false) {
    return;
  }

  var id = document.getElementById("editId").value;
  var c = citas.find(function (x) { return x.id == id; });

  var placa = document.getElementById("editPlaca").value.trim().toUpperCase();
  var marca = document.getElementById("editMarca").value.trim();
  var modelo = document.getElementById("editModelo").value.trim();
  var fecha = document.getElementById("editFecha").value;
  var hora = document.getElementById("editHora").value;

  var errores = [];
  if (marca == "" || modelo == "") {
    errores.push("Marca y modelo son obligatorios.");
  }
  if (validarPlaca(placa) == false) {
    errores.push("Placa inválida (ejemplo: ABC-1234).");
  }
  var errorFecha = validarFechaHora(fecha, hora, true);
  if (errorFecha != "") {
    errores.push(errorFecha);
  }
  if (errores.length > 0) {
    mostrarErrores("Revisa los datos", errores);
    return;
  }

  c.placa = placa;
  c.marca = marca;
  c.modelo = modelo;
  c.servicio = document.getElementById("editServicio").value;
  c.fecha = fecha;
  c.hora = hora;
  c.estado = document.getElementById("editEstado").value;

  guardarCitas();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalEditar")).hide();
  mostrarTablaAdmin();
  mostrarMisMantenimientos();
  Swal.fire({ icon: "success", title: "Solicitud actualizada" });
}

// Historial de un cliente (solo administrador)
function verHistorial(email) {
  if (esAdministrador() == false) {
    return;
  }
  var historial = citas.filter(function (c) {
    return c.clienteEmail.toLowerCase() == email.toLowerCase();
  });
  var cuerpo = document.getElementById("cuerpoHistorial");
  cuerpo.innerHTML = "";
  document.getElementById("historialTitulo").innerHTML = "Historial de " + email;

  historial.forEach(function (c) {
    cuerpo.innerHTML += "<tr><td>" + c.id + "</td><td>" + c.marca + " " + c.modelo + " (" + c.placa + ")</td>" +
      "<td>" + c.servicio + "</td><td>" + c.fecha + "</td><td>" + c.estado + "</td></tr>";
  });
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalHistorial")).show();
}

function eliminarCita(id) {
  if (esAdministrador() == false) {
    return;
  }
  Swal.fire({
    title: "¿Eliminar solicitud?",
    text: "Se eliminará " + id,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar"
  }).then(function (respuesta) {
    if (respuesta.isConfirmed) {
      citas = citas.filter(function (c) { return c.id != id; });
      guardarCitas();
      mostrarTablaAdmin();
      mostrarMisMantenimientos();
    }
  });
}

// ===== NUEVA SOLICITUD =====
function generarId() {
  var mayor = 100;
  for (var i = 0; i < citas.length; i++) {
    var numero = parseInt(citas[i].id.replace("SOL-", ""));
    if (numero > mayor) {
      mayor = numero;
    }
  }
  return "SOL-" + (mayor + 1);
}

function guardarSolicitud(evento) {
  evento.preventDefault();

  if (usuarioActual == null) {
    Swal.fire({ icon: "info", title: "Inicia sesión", text: "Debes iniciar sesión para registrar una solicitud." });
    return;
  }

  var nombre = document.getElementById("formNombre").value.trim();
  var email = document.getElementById("formEmail").value.trim();
  var tel = document.getElementById("formTelefono").value.trim();

  // El cliente siempre registra con sus propios datos
  if (usuarioActual.rol == "cliente") {
    nombre = usuarioActual.nombre;
    email = usuarioActual.email;
    tel = usuarioActual.tel;
  }

  var placa = document.getElementById("formPlaca").value.trim().toUpperCase();
  var marca = document.getElementById("formMarca").value.trim();
  var modelo = document.getElementById("formModelo").value.trim();
  var anio = document.getElementById("formAnio").value;
  var km = document.getElementById("formKm").value;
  var servicio = document.getElementById("formServicio").value;
  var fecha = document.getElementById("formFecha").value;
  var hora = document.getElementById("formHora").value;

  var errores = [];
  if (nombre == "") {
    errores.push("El nombre es obligatorio.");
  }
  if (validarCorreo(email) == false) {
    errores.push("Correo inválido.");
  }
  if (validarTelefono(tel) == false) {
    errores.push("Teléfono inválido (10 digitos, ejemplo 0991234567).");
  }
  if (validarPlaca(placa) == false) {
    errores.push("Placa inválida (ejemplo: ABC-1234).");
  }
  if (marca == "" || modelo == "") {
    errores.push("Marca y modelo son obligatorios.");
  }
  if (validarAnio(anio) == false) {
    errores.push("Año inválido (desde 1990 hasta el próximo año).");
  }
  if (validarKilometraje(km) == false) {
    errores.push("El kilometraje debe ser mayor a 0.");
  }
  if (servicio == "") {
    errores.push("Selecciona un servicio.");
  }
  var errorFecha = validarFechaHora(fecha, hora, false);
  if (errorFecha != "") {
    errores.push(errorFecha);
  }

  if (errores.length > 0) {
    mostrarErrores("No se guardó la solicitud", errores);
    return;
  }

  // Extras (checkboxes)
  var extras = [];
  var cajas = document.querySelectorAll(".extra");
  for (var caja of cajas) {
    if (caja.checked) {
      extras.push(caja.value);
    }
  }

  // Prioridad (radio buttons)
  var prioridad = document.querySelector("input[name='prioridad']:checked").value;

  var observaciones = document.getElementById("formObs").value.trim();
  if (observaciones == "") {
    observaciones = "Sin observaciones";
  }

  // Objeto de la nueva solicitud
  var nueva = {
    id: generarId(),
    clienteEmail: email,
    clienteNombre: nombre,
    clienteTelefono: tel,
    placa: placa,
    marca: marca,
    modelo: modelo,
    anio: parseInt(anio),
    kilometraje: parseFloat(km),
    servicio: servicio,
    fecha: fecha,
    hora: hora,
    prioridad: prioridad,
    extras: extras,
    observaciones: observaciones,
    estado: "Pendiente"
  };

  citas.unshift(nueva);
  guardarCitas();
  mostrarMisMantenimientos();
  if (usuarioActual.rol == "admin") {
    mostrarTablaAdmin();
  }

  // Limpiar los datos del vehiculo y del servicio
  document.getElementById("formPlaca").value = "";
  document.getElementById("formMarca").value = "";
  document.getElementById("formModelo").value = "";
  document.getElementById("formAnio").value = "";
  document.getElementById("formKm").value = "";
  document.getElementById("formServicio").value = "";
  document.getElementById("formFecha").value = "";
  document.getElementById("formHora").value = "";
  document.getElementById("formObs").value = "";
  for (var c of cajas) {
    c.checked = false;
  }

  Swal.fire({ icon: "success", title: "Solicitud guardada", text: "Código: " + nueva.id });
}

// ===== EVENTOS =====
document.addEventListener("DOMContentLoaded", function () {
  cargarCitas();

  // Llenar los select con los arrays
  var opciones = servicios.map(function (s) {
    return "<option value='" + s + "'>" + s + "</option>";
  }).join("");
  document.getElementById("formServicio").innerHTML = "<option value=''>-- Selecciona --</option>" + opciones;
  document.getElementById("editServicio").innerHTML = opciones;

  document.getElementById("editEstado").innerHTML = estados.map(function (e) {
    return "<option value='" + e + "'>" + e + "</option>";
  }).join("");

  document.getElementById("formLogin").addEventListener("submit", function (evento) {
    evento.preventDefault();
    iniciarSesion(document.getElementById("loginEmail").value, document.getElementById("loginPassword").value);
  });

  document.getElementById("btnSalir").addEventListener("click", cerrarSesion);
  document.getElementById("formCita").addEventListener("submit", guardarSolicitud);
  document.getElementById("formEditar").addEventListener("submit", guardarEdicion);

  // La placa se escribe en mayusculas
  document.getElementById("formPlaca").addEventListener("input", function (e) {
    e.target.value = e.target.value.toUpperCase();
  });

  // Si un cliente intenta entrar a Administración
  document.getElementById("enlaceAdmin").addEventListener("click", function (e) {
    if (usuarioActual == null || usuarioActual.rol != "admin") {
      e.preventDefault();
      Swal.fire({ icon: "error", title: "Acceso denegado", text: "Solo el administrador puede entrar a Administración." });
    }
  });

  actualizarPagina();
});
