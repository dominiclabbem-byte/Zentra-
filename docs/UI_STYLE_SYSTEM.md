# UI Style System

La capa visual central vive en tres lugares:

- `tailwind.config.js`: tokens de marca `brand.*` para color, sombras, gradientes y animaciones.
- `src/index.css`: clases reutilizables `ui-*` para patrones comunes.
- `src/styles/ui.js`: constantes JS opcionales para componentes que necesiten componer clases dinamicamente.

## Tokens Principales

- `brand-ink`: color primario oscuro.
- `brand-inkLight`: variante para gradientes.
- `brand-inkDark`: fondos oscuros.
- `brand-accent`: acento principal.
- `brand-canvas`: fondo general de pantallas.
- `brand-panel`: fondo de chips y paneles suaves.
- `brand-panelBorder`: borde suave de chips y paneles.
- `brand-mint`: paneles informativos de tono verde/agua.

## Utilidades Compartidas

- `ui-page`: fondo base de pantalla.
- `ui-card`: tarjeta estatica.
- `ui-card-interactive`: tarjeta clickeable con hover.
- `ui-input`: input textual.
- `ui-select`: select.
- `ui-textarea`: textarea.
- `ui-btn-primary`: boton primario.
- `ui-btn-secondary`: boton secundario.
- `ui-chip`: etiqueta compacta.

## Regla Practica

Para proponer cambios de UI, primero cambia tokens o clases `ui-*`. Solo agrega clases inline cuando el caso sea realmente especifico del componente.
