document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'http://localhost:8081/api/entregas';

    // Main elements
    const deliveriesGrid = document.getElementById('deliveries-grid');
    const addDeliveryBtn = document.getElementById('add-delivery-btn');

    // Modal elements
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modal = document.getElementById('delivery-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const deliveryForm = document.getElementById('delivery-form');

    // Form fields
    const deliveryIdInput = document.getElementById('delivery-id');
    const orderIdInput = document.getElementById('order-id');
    const addressInput = document.getElementById('address');
    const trackingNumberInput = document.getElementById('tracking-number');
    const statusInput = document.getElementById('status');
    
    // --- API Functions ---

    const fetchDeliveries = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const deliveries = await response.json();
            renderDeliveries(deliveries);
        } catch (error) {
            console.error('Error fetching deliveries:', error);
            deliveriesGrid.innerHTML = '<p>Error al cargar las entregas. Asegúrate de que el microservicio esté en ejecución.</p>';
        }
    };

    const saveDelivery = async (delivery) => {
        const isUpdating = !!delivery.id;
        const url = isUpdating ? `${apiUrl}/${delivery.id}` : apiUrl;
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delivery)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorBody}`);
            }
            
            closeModal();
            fetchDeliveries(); // Refresh the grid
        } catch (error) {
            console.error('Error saving delivery:', error);
            alert('No se pudo guardar la entrega. Revisa la consola para más detalles.');
        }
    };

    // --- UI Functions ---

    const getStatusClass = (status) => `status-${status.toUpperCase()}`;

    const renderDeliveries = (deliveries) => {
        deliveriesGrid.innerHTML = '';
        if (deliveries.length === 0) {
            deliveriesGrid.innerHTML = '<p>No hay entregas para mostrar.</p>';
            return;
        }

        deliveries.forEach(delivery => {
            const card = document.createElement('div');
            card.className = 'delivery-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3>Orden #${delivery.orderId}</h3>
                    <span class="status-badge ${getStatusClass(delivery.status)}">${delivery.status}</span>
                </div>
                <div class="card-body">
                    <p><strong>Dirección:</strong> ${delivery.address}</p>
                    <p><strong>Seguimiento:</strong> ${delivery.trackingNumber || 'N/A'}</p>
                </div>
                <div class="card-footer">
                    <button class="card-button edit-btn" data-id="${delivery.id}">Editar</button>
                </div>
            `;
            deliveriesGrid.appendChild(card);

            // Add event listener for the edit button on this specific card
            card.querySelector('.edit-btn').addEventListener('click', () => {
                openModalForEdit(delivery);
            });
        });
    };

    const openModalForCreate = () => {
        modalTitle.textContent = 'Agregar Nueva Entrega';
        deliveryForm.reset();
        deliveryIdInput.value = '';
        modal.classList.remove('hidden');
        modalBackdrop.classList.remove('hidden');
    };

    const openModalForEdit = (delivery) => {
        modalTitle.textContent = 'Editar Entrega';
        deliveryForm.reset();
        
        deliveryIdInput.value = delivery.id;
        orderIdInput.value = delivery.orderId;
        addressInput.value = delivery.address;
        trackingNumberInput.value = delivery.trackingNumber;
        statusInput.value = delivery.status;

        modal.classList.remove('hidden');
        modalBackdrop.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modalBackdrop.classList.add('hidden');
    };

    // --- Event Listeners ---

    addDeliveryBtn.addEventListener('click', openModalForCreate);
    closeModalBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    deliveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const deliveryData = {
            orderId: parseInt(orderIdInput.value, 10),
            address: addressInput.value,
            trackingNumber: trackingNumberInput.value,
            status: statusInput.value,
        };

        const deliveryId = deliveryIdInput.value;
        if (deliveryId) {
            deliveryData.id = parseInt(deliveryId, 10);
        }

        saveDelivery(deliveryData);
    });

    // --- Initial Load ---
    fetchDeliveries();
});
