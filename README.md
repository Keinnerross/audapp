## Sobre el proyecto

Existen 6 tipos de informes o categorías dentro del proyecto:

1. Acreditación de competencias
2. Hábitos operacionales
3. Gestión y mantención 
4. Talleres 
5. Informe maquinarias 
6. Requisitos complementarios


##### Modulos:

Esos son conjutos de datos agrupados en módulos con una estructura que se repite através de los diferentes informes.


1. base_informe: 
El primer módulo dinámico que se repetirá es el de "base_informe" Este módulo contiene el template de los datos que tienen todos los informes,
es decir, los datos del auditor, de la empresa a evaluar, el nombre del informe, la fecha entre otros.

2. resumen_informe:

Este módulo corresponde a los resumenes de cada categoría de la auditoría y consta de 3 elementos que se repiten

- CONFORME	
- NO CONFORME	
- CON OBSERVACIONES	
- NO APLICA 

Cuandos e adjunta en la costrucción del tipo de contenido, se permite uno solo por cada uno, ya que es un resumen por cada tipo de categoría de la auditoría, ejemplo:

1 Modulo de resumen para PROCEDIMIENTO GENERAL		
1 Módulo de resumen para HABILITACION		


si se permitieran varios, sería muchos resumenes con el mismo nombre a modo de ejemplo 5 de PROCEDIMIENTO GENERAL y en la estructura esta forma es la incorrecta.


Todo resumen tiene diferentes requerimientos que en base a la evaluación de los requerimientos, el auditor llenará el resumen.


3. Requerimiento:
Este componente tiene 
nombre del requerimiento.
valor del requerimiento: [cumple, no cumple, oportunidad de mejora, no aplica].
Comentario
Recomendación
Archivos


4. Requerimiento: singular un nobre y su valor es booleano, el módulo requerimientos consta de varios "requerimiento"







