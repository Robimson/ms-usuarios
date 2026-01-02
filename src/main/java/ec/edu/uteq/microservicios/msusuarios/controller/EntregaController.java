package ec.edu.uteq.microservicios.msusuarios.controller;

import ec.edu.uteq.microservicios.msusuarios.model.Entrega;
import ec.edu.uteq.microservicios.msusuarios.service.EntregaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/entregas")
@CrossOrigin(origins = "*")
public class EntregaController {

    private final EntregaService service;

    public EntregaController(EntregaService service) {
        this.service = service;
    }

    @GetMapping
    public List<Entrega> listar() {
        return service.listar();
    }

    @PostMapping
    public Entrega crear(@RequestBody Entrega entrega) {
        return service.crear(entrega);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Entrega> actualizar(@PathVariable Long id, @RequestBody Entrega entrega) {
        try {
            Entrega updatedEntrega = service.actualizar(id, entrega);
            return ResponseEntity.ok(updatedEntrega);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}