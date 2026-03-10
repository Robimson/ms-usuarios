package ec.edu.uteq.microservicios.msusuarios.model;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClienteExternoDto {

    private Long id;
    private String cedula;
    private String nombre;
    private String apellido;
    private Integer edad;
    private String correo;
    private String telefono;
    private String direccion;
    private String estado;
    private String fechaRegistro;
}