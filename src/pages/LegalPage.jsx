import { Link } from 'react-router-dom';

const content = {
  privacidad: {
    title: 'Privacidad',
    intro: 'Zentra usa la informacion de cuenta, empresa y actividad comercial para operar solicitudes, cotizaciones, conversaciones y notificaciones dentro de la plataforma.',
    sections: [
      ['Datos comerciales', 'Podemos guardar razon social, RUT, rubro, comuna, datos de contacto y preferencias operativas declaradas por el usuario.'],
      ['Uso de la informacion', 'La informacion se usa para conectar compradores con proveedores, mostrar perfiles comerciales, gestionar cotizaciones y entregar soporte.'],
      ['Control del usuario', 'Los usuarios pueden solicitar correcciones o baja de datos escribiendo a contacto@zentra.cl.'],
    ],
  },
  terminos: {
    title: 'Terminos',
    intro: 'Zentra facilita el contacto comercial entre compradores y proveedores food service. Las condiciones finales de precio, despacho, pago y postventa son acordadas entre las partes.',
    sections: [
      ['Uso de la plataforma', 'Cada usuario debe publicar informacion comercial veraz y mantener actualizados sus datos de contacto, rubro y disponibilidad.'],
      ['Proveedores verificados', 'La verificacion indica revision de datos declarados; no reemplaza la evaluacion comercial que cada comprador debe realizar antes de comprar.'],
      ['Cotizaciones', 'Las ofertas pueden variar segun stock, fecha, comuna, volumen y condiciones acordadas fuera o dentro de Zentra.'],
    ],
  },
};

export default function LegalPage({ type }) {
  const page = content[type] ?? content.privacidad;

  return (
    <section className="bg-brand-canvas px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-premium">
        <Link to="/" className="text-sm font-bold text-brand-accent hover:text-brand-accentDark">
          Volver a Zentra
        </Link>
        <h1 className="mt-6 text-4xl font-black text-brand-ink">{page.title}</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">{page.intro}</p>
        <div className="mt-8 space-y-6">
          {page.sections.map(([title, body]) => (
            <article key={title}>
              <h2 className="text-lg font-black text-brand-ink">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
