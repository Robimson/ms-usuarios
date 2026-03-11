package ec.edu.uteq.microservicios.msusuarios.model;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FacturaExternoDto {
    private Long id;
    private String fecha;
    private Double total;
    private ClienteFactura cliente;
    private List<DetalleFactura> detalles;

    @Getter @Setter
    public static class ClienteFactura {
        private Long id;
        private String nombre;
        private String dni;
        private String email;
        private String direccion;
    }

    @Getter @Setter
    public static class DetalleFactura {
        private Integer cantidad;
        private Double precioUnitario;
        private String productoNombre;
        private Double subtotal;
    }
}