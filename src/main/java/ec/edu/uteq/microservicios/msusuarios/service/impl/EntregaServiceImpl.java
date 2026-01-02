package ec.edu.uteq.microservicios.msusuarios.service.impl;

import ec.edu.uteq.microservicios.msusuarios.model.Entrega;
import ec.edu.uteq.microservicios.msusuarios.repository.EntregaRepository;
import ec.edu.uteq.microservicios.msusuarios.service.EntregaService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class EntregaServiceImpl implements EntregaService {

    private final EntregaRepository repo;

    public EntregaServiceImpl(EntregaRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Entrega> listar() {
        return repo.findAll();
    }

    @Override
    public Entrega crear(Entrega entrega) {
        Objects.requireNonNull(entrega, "La entrega a crear no puede ser nula.");
        if (entrega.getStatus() == null) {
            entrega.setStatus(Entrega.Estado.PENDIENTE);
        }
        return repo.save(entrega);
    }

    @Override
    public Entrega actualizar(Long id, Entrega entrega) {
        Objects.requireNonNull(id, "El ID de la entrega a actualizar no puede ser nulo.");
        Objects.requireNonNull(entrega, "La entrega a actualizar no puede ser nula.");

        return repo.findById(id).map(e -> {
            e.setOrderId(entrega.getOrderId());
            e.setAddress(entrega.getAddress());
            e.setStatus(entrega.getStatus());
            e.setTrackingNumber(entrega.getTrackingNumber());
            return repo.save(e);
        }).orElseThrow(() -> new RuntimeException("Entrega no encontrada con ID: " + id));
    }
}