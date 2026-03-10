document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://130.107.144.11:8092/api/entregas';
    const apiClientesExternosUrl = 'http://130.107.144.11:8092/api/clientes-externos';

    let allDeliveries = [];

    const STATUS_MAP = {
        'PENDIENTE': { class: 'status-PENDIENTE', label: 'En Espera',  icon: '⏳', priority: 1 },
        'ENVIADO':   { class: 'status-ENVIADO',   label: 'En Camino',  icon: '🚚', priority: 2 },
        'ENTREGADO': { class: 'status-ENTREGADO', label: 'Entregado',  icon: '✅', priority: 3 },
        'CANCELADO': { class: 'status-CANCELADO', label: 'Cancelado',  icon: '❌', priority: 4 }
    };

    // UI Elements
    const deliveriesGrid = document.getElementById('deliveries-grid');
    const deliveryForm = document.getElementById('delivery-form');
    const modal = document.getElementById('delivery-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const drawer = document.getElementById('history-drawer');
    const drawerBackdrop = document.getElementById('drawer-backdrop');
    const searchInput = document.getElementById('search-input');
    const resetSearchBtn = document.getElementById('reset-search-btn');


    const clienteExternoSelect = document.getElementById('cliente-externo');


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


    const fetchClientesExternos = async () => {
        try {
            const response = await fetch(apiClientesExternosUrl);
            const clientes = await response.json();

            if (clienteExternoSelect) {
                clienteExternoSelect.innerHTML = '<option value="">-- Seleccione un cliente para auto-completar --</option>';
                clientes.forEach(c => {
                    const option = document.createElement('option');
                    option.value = c.id;

                    option.dataset.direccion = c.direccion || '';
                    option.dataset.email = c.correo || '';
                    option.textContent = `${c.nombre} ${c.apellido} (${c.cedula})`;
                    clienteExternoSelect.appendChild(option);
                });
            }
        } catch (e) {
            console.error("Error al cargar clientes externos:", e);
        }
    };


    if (clienteExternoSelect) {
        clienteExternoSelect.onchange = (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption && selectedOption.value !== "") {
                document.getElementById('address').value = selectedOption.dataset.direccion;
                document.getElementById('email').value = selectedOption.dataset.email;
                showToast(`Datos de ${selectedOption.textContent} cargados`);
            }
        };
    }

    const sortDeliveries = (list) => {
        return list.sort((a, b) => {
            const priorityA = STATUS_MAP[a.status].priority;
            const priorityB = STATUS_MAP[b.status].priority;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return b.id - a.id;
        });
    };

    const performSearch = () => {
        const term = searchInput.value.trim().toLowerCase();
        if (term === "") {
            renderDeliveries(allDeliveries);
            resetSearchBtn.style.display = 'none';
            return;
        }
        const filtered = allDeliveries.filter(d =>
            d.orderId?.toString().includes(term) ||
            d.address?.toLowerCase().includes(term) ||
            d.email?.toLowerCase().includes(term) ||
            d.trackingNumber?.toLowerCase().includes(term)
        );
        renderDeliveries(filtered);
        resetSearchBtn.style.display = 'inline-block';
    };

    searchInput.oninput = performSearch;

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
        } catch (e) { showToast('Error de conexión con el servidor', 'error'); }
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
                showToast(isEdit ? 'Actualizado correctamente' : 'Creado con éxito');
                closeModal();
                fetchDeliveries();
                fetchStats();
            } else {
                const errorData = await response.json();
                const mensajeLimpio = errorData.message || 'Error desconocido al guardar';
                showToast(mensajeLimpio, 'error');
            }
        } catch (e) {
            showToast('Error crítico de red o servidor', 'error');
        }
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
        const sorted = sortDeliveries([...deliveries]);

        if (sorted.length === 0) {
            deliveriesGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#999; margin-top:20px;">No hay resultados.</p>';
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
                    <p><strong>📍 Dirección:</strong> ${d.address}</p>
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
                <p><strong>Cliente:</strong> ${d.email}</p>
                <p><strong>Destino:</strong> ${d.address}</p>
            </div>
            <div class="timeline">
                <div class="timeline-item"><h4>Orden Registrada</h4><p>ID de Orden #${d.orderId} validado en sistema.</p></div>
                <div class="timeline-item"><h4>Estado Actual: ${d.status}</h4><p>Notificación enviada al correo del cliente.</p></div>
            </div>
        `;
        drawer.classList.remove('hidden');
        drawerBackdrop.classList.remove('hidden');
    };

    document.querySelectorAll('.stat-card').forEach(card => {
        card.onclick = () => {
            const statusKey = card.id.split('-')[1].toUpperCase();
            const filtered = allDeliveries.filter(d => d.status === statusKey);
            renderDeliveries(filtered);
            resetSearchBtn.style.display = 'inline-block';
            showToast(`Filtrando: ${statusKey}`);
        };
    });

    const openModalForEdit = (d) => {
        document.getElementById('modal-title').textContent = 'Editar Entrega';
        document.getElementById('delivery-id').value = d.id;
        document.getElementById('order-id').value = d.orderId;
        document.getElementById('address').value = d.address;
        document.getElementById('email').value = d.email || '';
        document.getElementById('tracking-number').value = d.trackingNumber || '';
        document.getElementById('status').value = d.status;


        if (clienteExternoSelect) clienteExternoSelect.parentElement.style.display = 'none';

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
        document.getElementById('modal-title').textContent = 'Agregar Entrega';
        deliveryForm.reset();
        document.getElementById('delivery-id').value = '';

        if (clienteExternoSelect) {
            clienteExternoSelect.parentElement.style.display = 'block';
            fetchClientesExternos();
        }

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
            orderId: parseInt(document.getElementById('order-id').value),
            address: document.getElementById('address').value,
            email: document.getElementById('email').value,
            trackingNumber: document.getElementById('tracking-number').value,
            status: document.getElementById('status').value
        };
        const id = document.getElementById('delivery-id').value;
        if (id) data.id = parseInt(id);
        saveDelivery(data);
    };

    resetSearchBtn.onclick = () => {
        searchInput.value = '';
        renderDeliveries(allDeliveries);
        resetSearchBtn.style.display = 'none';
    };

    fetchDeliveries();
    fetchStats();
});