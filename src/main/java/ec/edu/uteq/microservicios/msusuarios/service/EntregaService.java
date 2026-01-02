package ec.edu.uteq.microservicios.msusuarios.service;

import ec.edu.uteq.microservicios.msusuarios.model.Entrega;
//import org.springframework.lang.NonNull;
import java.util.List;

public interface EntregaService {
    List<Entrega> listar();
    Entrega crear(Entrega entrega);
    Entrega actualizar(Long id, Entrega entrega);
}