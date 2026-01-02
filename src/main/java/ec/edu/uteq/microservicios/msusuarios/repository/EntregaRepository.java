package ec.edu.uteq.microservicios.msusuarios.repository;

import ec.edu.uteq.microservicios.msusuarios.model.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregaRepository extends JpaRepository<Entrega, Long> {
}