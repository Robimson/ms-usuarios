document.addEventListener('DOMContentLoaded', () => {

    const apiUrl = 'http://130.107.144.11:8092/api/entregas';
    const apiClientesExternosUrl = 'http://130.107.144.11:8092/api/clientes-externos';
    const apiFacturasExternasUrl = 'http://130.107.144.11:8092/api/facturas-externas';

    let allDeliveries = [];

    const STATUS_MAP = {
        'PENDIENTE': { class: 'status-PENDIENTE', label: 'En Espera',  icon: '⏳', priority: 1 },
        'ENVIADO':   { class: 'status-ENVIADO',   label: 'En Camino',  icon: '🚚', priority: 2 },
        'ENTREGADO': { class: 'status-ENTREGADO', label: 'Entregado',  icon: '✅', priority: 3 },
        'CANCELADO': { class: 'status-CANCELADO', label: 'Cancelado',  icon: '❌', priority: 4 }
    };


    const deliveriesGrid = document.getElementById('deliveries-grid');
    const deliveryForm = document.getElementById('delivery-form');
    const modal = document.getElementById('delivery-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const drawer = document.getElementById('history-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const searchInput = document.getElementById('search-input');
    const resetSearchBtn = document.getElementById('reset-search-btn');


    const orderIdInput = document.getElementById('order-id');
    const cedulaBuscarInput = document.getElementById('cedula-buscar');
    const btnVerificarMaestro = document.getElementById('btn-verificar-maestro');


    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    };

    const rellenarCampos = (nombre, dni, email, direccion, telefono = '') => {
        document.getElementById('client-name').value = nombre || '';
        document.getElementById('client-cedula').value = dni || '';
        document.getElementById('email').value = email || '';
        document.getElementById('address').value = direccion || '';
        document.getElementById('phone').value = telefono || '';
        if(orderId) document.getElementById('order-id').value = orderId;
    };


    const verificarDatosMaestro = async () => {
        const orderId = orderIdInput.value.trim();
        const cedula = cedulaBuscarInput.value.trim();

        if (!orderId && !cedula) {
            showToast('Por favor, ingrese un ID de Orden o una Cédula', 'error');
            return;
        }

        try {
            btnVerificarMaestro.textContent = 'Buscando...';
            btnVerificarMaestro.disabled = true;
            let encontrado = false;


            if (orderId) {
                const response = await fetch(`${apiFacturasExternasUrl}/${orderId}`);
                if (response.ok) {
                    const factura = await response.json();
                    rellenarCampos(
                        factura.cliente.nombre,
                        factura.cliente.dni,
                        factura.cliente.email,
                        factura.cliente.direccion
                    );
                    showToast(`Datos de Factura #${orderId} cargados correctamente`);
                    encontrado = true;
                } else if (!cedula) {
                    showToast('No se encontró la factura con ese ID', 'error');
                }
            }

            if (!encontrado && cedula) {
                const response = await fetch(`${apiFacturasExternasUrl}/dni/${cedula}`);
                if (response.ok) {
                    const factura = await response.json();
                    rellenarCampos(
                        factura.cliente.nombre,
                        factura.cliente.dni,
                        factura.cliente.email,
                        factura.cliente.direccion
                    );
                    showToast(`Dirección recuperada de la última factura del cliente`);
                    encontrado = true;
                }
            }

            if (!encontrado && cedula) {
                const response = await fetch(`${apiClientesExternosUrl}/${cedula}`);
                if (response.ok) {
                    const cliente = await response.json();
                    rellenarCampos(
                        `${cliente.nombre} ${cliente.apellido}`,
                        cliente.cedula,
                        cliente.correo,
                        cliente.direccion,
                        cliente.telefono
                    );
                    showToast(`Datos personales cargados desde Micro de Clientes`);
                    encontrado = true;
                }
            }

            if (!encontrado) {
                showToast('No se encontró información en ningún sistema externo', 'error');
            }

        } catch (e) {
            showToast('Error de conexión con los servidores externos', 'error');
        } finally {
            btnVerificarMaestro.textContent = 'Verificar';
            btnVerificarMaestro.disabled = false;
        }
    };

    if (btnVerificarMaestro) {
        btnVerificarMaestro.onclick = verificarDatosMaestro;
    }

    [orderIdInput, cedulaBuscarInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                verificarDatosMaestro();
            }
        });
    });



    const fetchStats = async () => {
        try {
            const response = await fetch(`${apiUrl}/estadisticas`);
            const stats = await response.json();
            document.getElementById('count-pendiente').textContent = stats.PENDIENTE || 0;
            document.getElementById('count-enviado').textContent = stats.ENVIADO || 0;
            document.getElementById('count-entregado').textContent = stats.ENTREGADO || 0;
            document.getElementById('count-cancelado').textContent = stats.CANCELADO || 0;
        } catch (e) { console.error(e); }
    };

    const fetchDeliveries = async () => {
        try {
            const response = await fetch(apiUrl);
            allDeliveries = await response.json();
            renderDeliveries(allDeliveries);
        } catch (e) { showToast('Error de conexión con el microservicio', 'error'); }
    };

    const saveDelivery = async (delivery) => {
        const isEdit = !!delivery.id;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${apiUrl}/${delivery.id}` : apiUrl;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delivery)
            });

            if (response.ok) {
                showToast(isEdit ? 'Actualizado correctamente' : 'Entrega registrada con éxito');
                closeModal();
                fetchDeliveries();
                fetchStats();
            } else {
                const errorData = await response.json();
                showToast(errorData.message || 'Error al procesar la entrega', 'error');
            }
        } catch (e) { showToast('Error crítico de red', 'error'); }
    };

    const deleteDelivery = async (id) => {
        if (!confirm('¿Eliminar esta entrega permanentemente?')) return;
        try {
            const response = await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                showToast('Entrega eliminada');
                fetchDeliveries();
                fetchStats();
            }
        } catch (e) { showToast('Error al eliminar', 'error'); }
    };


    const renderDeliveries = (deliveries) => {
        deliveriesGrid.innerHTML = '';
        const sorted = [...deliveries].sort((a, b) => {
            const priorityA = STATUS_MAP[a.status].priority;
            const priorityB = STATUS_MAP[b.status].priority;
            return (priorityA !== priorityB) ? priorityA - priorityB : b.id - a.id;
        });

        if (sorted.length === 0) {
            deliveriesGrid.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">No hay entregas registradas.</p>';
            return;
        }

        sorted.forEach(d => {
            const config = STATUS_MAP[d.status];
            const card = document.createElement('div');
            card.className = 'delivery-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3>Orden #${d.orderId}</h3>
                    <span class="status-badge ${config.class}">${config.icon} ${config.label}</span>
                </div>
                <div class="card-body">
                    <p><strong>👤 Cliente:</strong> ${d.clientName || 'No registrado'}</p>
                    <p><strong>🆔 Cédula:</strong> ${d.clientCedula || 'N/A'}</p>
                    <p><strong>📍 Dirección:</strong> ${d.address}</p>
                    <p><strong>📞 Teléfono:</strong> ${d.phone || 'N/A'}</p>
                    <p><strong>📧 Email:</strong> ${d.email || 'N/A'}</p>
                    <p><strong>📦 Seguimiento:</strong> ${d.trackingNumber || 'N/A'}</p>
                </div>
                <div class="card-footer">
                    <button class="card-button edit-btn">Editar</button>
                    <button class="card-button history-btn">📜 Historial</button>
                    <button class="card-button delete-btn">Eliminar</button>
                </div>
            `;
            deliveriesGrid.appendChild(card);
            card.querySelector('.edit-btn').onclick = () => openModalForEdit(d);
            card.querySelector('.delete-btn').onclick = () => deleteDelivery(d.id);
            card.querySelector('.history-btn').onclick = () => openHistory(d);
        });
    };

    const openHistory = (d) => {
        const content = document.getElementById('drawer-content');
        content.innerHTML = `
            <div class="drawer-info-box">
                <p><strong>Orden:</strong> #${d.orderId}</p>
                <p><strong>Cliente:</strong> ${d.clientName}</p>
                <p><strong>Destino:</strong> ${d.address}</p>
            </div>
            <div class="timeline">
                <div class="timeline-item"><h4>Registro</h4><p>Datos validados e integrados con micros externos.</p></div>
                <div class="timeline-item"><h4>Estado Actual: ${d.status}</h4><p>Notificación enviada a: ${d.email || 'N/A'}</p></div>
            </div>
        `;
        drawer.classList.remove('hidden');
        drawerBackdrop.classList.remove('hidden');
    };

    const openModalForEdit = (d) => {
        document.getElementById('modal-title').textContent = 'Editar Entrega';
        document.getElementById('delivery-id').value = d.id;
        orderIdInput.value = d.orderId;
        document.getElementById('address').value = d.address;
        document.getElementById('email').value = d.email || '';
        document.getElementById('tracking-number').value = d.trackingNumber || '';
        document.getElementById('status').value = d.status;
        document.getElementById('client-name').value = d.clientName || '';
        document.getElementById('client-cedula').value = d.clientCedula || '';
        document.getElementById('phone').value = d.phone || '';

        btnVerificarMaestro.parentElement.style.display = 'none';

        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
        drawer.classList.add('hidden');
        drawerBackdrop.classList.add('hidden');
    };

    document.getElementById('add-delivery-btn').onclick = () => {
        document.getElementById('modal-title').textContent = 'Agregar Nueva Entrega';
        deliveryForm.reset();
        document.getElementById('delivery-id').value = '';
        btnVerificarMaestro.parentElement.style.display = 'block';
        modal.classList.remove('hidden');
        backdrop.classList.remove('hidden');
    };

    document.getElementById('close-modal-btn').onclick = closeModal;
    document.getElementById('close-drawer-btn').onclick = closeModal;
    backdrop.onclick = closeModal;
    drawerBackdrop.onclick = closeModal;

    deliveryForm.onsubmit = (e) => {
        e.preventDefault();
        const data = {
            orderId: parseInt(orderIdInput.value),
            address: document.getElementById('address').value,
            email: document.getElementById('email').value,
            trackingNumber: document.getElementById('tracking-number').value,
            status: document.getElementById('status').value,
            clientName: document.getElementById('client-name').value,
            clientCedula: document.getElementById('client-cedula').value,
            phone: document.getElementById('phone').value
        };
        const id = document.getElementById('delivery-id').value;
        if (id) data.id = parseInt(id);
        saveDelivery(data);
    };

    searchInput.oninput = () => {
        const term = searchInput.value.trim().toLowerCase();
        if (term === "") {
            renderDeliveries(allDeliveries);
            resetSearchBtn.style.display = 'none';
            return;
        }
        const filtered = allDeliveries.filter(d =>
            d.orderId?.toString().includes(term) ||
            d.clientName?.toLowerCase().includes(term) ||
            d.clientCedula?.toLowerCase().includes(term) ||
            d.trackingNumber?.toLowerCase().includes(term)
        );
        renderDeliveries(filtered);
        resetSearchBtn.style.display = 'inline-block';
    };

    resetSearchBtn.onclick = () => {
        searchInput.value = '';
        renderDeliveries(allDeliveries);
        resetSearchBtn.style.display = 'none';
    };

    document.querySelectorAll('.stat-card').forEach(card => {
        card.onclick = () => {
            const statusKey = card.id.split('-')[1].toUpperCase();
            renderDeliveries(allDeliveries.filter(d => d.status === statusKey));
            resetSearchBtn.style.display = 'inline-block';
        };
    });

    fetchDeliveries();
    fetchStats();
});