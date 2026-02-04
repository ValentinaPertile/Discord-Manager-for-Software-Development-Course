import './AboutUs.css'

function AboutUs() {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1>Sobre Nosotros</h1>
        <div className="about-content">
          <p>
            Esta aplicación te permite gestionar tus servidores de Discord de manera sencilla.
          </p>
          <p>
            Desde aquí tendrás una visión más amplia y de bolsillo.
          </p>
          <h2>Características:</h2>
          <ul>
            <li>Visualización de servidores donde eres administrador</li>
            <li>Interfaz sencilla y portable</li>
            <li>Información actualizada en tiempo real</li>
          </ul>
          <p>
            Gracias por elegirnos! <br />
            Atte Equipo DSMB
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutUs