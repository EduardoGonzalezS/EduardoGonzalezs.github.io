var nodesAnimation = [];
document.addEventListener('DOMContentLoaded', () => {
  //===
  // VARIABLES
  //===
  const DATE_TARGET = new Date('11/11/2023 0:01 AM');
  // DOM for render
  const SPAN_DAYS = document.querySelector('span#days');
  const SPAN_HOURS = document.querySelector('span#hours');
  const SPAN_MINUTES = document.querySelector('span#minutes');
  const SPAN_SECONDS = document.querySelector('span#seconds');
  // Milliseconds for the calculations
  const MILLISECONDS_OF_A_SECOND = 1000;
  const MILLISECONDS_OF_A_MINUTE = MILLISECONDS_OF_A_SECOND * 60;
  const MILLISECONDS_OF_A_HOUR = MILLISECONDS_OF_A_MINUTE * 60;
  const MILLISECONDS_OF_A_DAY = MILLISECONDS_OF_A_HOUR * 24

  //===
  // FUNCTIONS
  //===

  /**
  * Method that updates the countdown and the sample
  */
  function updateCountdown() {
    // Calcs
    const NOW = new Date()
    const DURATION = DATE_TARGET - NOW;
    const REMAINING_DAYS = Math.floor(DURATION / MILLISECONDS_OF_A_DAY);
    const REMAINING_HOURS = Math.floor((DURATION % MILLISECONDS_OF_A_DAY) / MILLISECONDS_OF_A_HOUR);
    const REMAINING_MINUTES = Math.floor((DURATION % MILLISECONDS_OF_A_HOUR) / MILLISECONDS_OF_A_MINUTE);
    const REMAINING_SECONDS = Math.floor((DURATION % MILLISECONDS_OF_A_MINUTE) / MILLISECONDS_OF_A_SECOND);
    // Thanks Pablo Monteserín (https://pablomonteserin.com/cuenta-regresiva/)

    // Render
    SPAN_DAYS.textContent = REMAINING_DAYS;
    SPAN_HOURS.textContent = REMAINING_HOURS;
    SPAN_MINUTES.textContent = REMAINING_MINUTES;
    SPAN_SECONDS.textContent = REMAINING_SECONDS;
  }
  updateCountdown();
  // Refresh every second
  setInterval(updateCountdown, MILLISECONDS_OF_A_SECOND);

  // debugger;
  observer = new IntersectionObserver(entries => {
    // debugger
    // Recorrer las entradas recibidas
    entries.forEach(entry => {
      // Está visible en el viewport
      if (entry.intersectionRatio > 0) {
        // entry.target es el elemento que se está observando
        // Agregar la clase para animar
        // debugger
        //entry.target.classList.add('itinerarioClss');
        // Dejar de observar
        observer.unobserve(entry.target);
      }
    });
  });
  // Observar elemento a animar
  // observer.observe(document.querySelector('#itinerarioClss'));
  const inViewport = (entries, observer) => {
    entries.forEach(entry => {
      entry.target.classList.toggle("is-inViewport", entry.isIntersecting);
    });
  };

  const Obs = new IntersectionObserver(inViewport);
  const obsOptions = {}; //See: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#Intersection_observer_options

  // Attach observer to every [data-inviewport] element:
  const ELs_inViewport = document.querySelectorAll('[data-inviewport]');
  ELs_inViewport.forEach(EL => {
    Obs.observe(EL, obsOptions);
  });
});
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function audioElement() {
  var playMusic = true;
  var play = playMusic;
  // debugger
  // var audioElement = document.createElement('audio');
  var audioElement = document.getElementById("AudioControl");
  // audioElement.setAttribute('src', 'assets/music/Yellow.mp3');
  // audioElement.autoplay = playMusic;
  // audioElement.play();
  $("#Btnplay").on('click', function () {
    if (play) {
      $("#BtnIcon").removeClass("bi-play-fill");
      $("#BtnIcon").addClass("bi-pause-fill");
      audioElement.play();
    }
    else {
      $("#BtnIcon").removeClass("bi-pause-fill");
      $("#BtnIcon").addClass("bi-play-fill");
      audioElement.pause();
    }
    play = !play;
  });
  // demo(audioElement);
};
const OpenRefConfirmation = function () {
  var href = $(this).prop('href');
  if (href === undefined)
    href = $(this).attr('href');
  console.log(href);
  window.open(href, '_blank');
};
$(document).ready(function () {
  $("#aRefBelen").on('click', OpenRefConfirmation);
  $("#aRefEduardo").on('click', OpenRefConfirmation);
  $("#BtnMesaLiverpool").on('click', OpenRefConfirmation);
  $("#BtnMesaAmazon").on('click', OpenRefConfirmation);
  audioElement();
  document.body.addEventListener("click", function () {
    if (onlyOne) {
      onlyOne = false;
      $("#Btnplay").trigger("click");
    }
  });


  // Create a new IntersectionObserver object
  let observer = new IntersectionObserver(function (entries, observer) {
    for (let entry of entries) {
      if (entry.isIntersecting) {
        var elementAni = nodesAnimation.find(x => x.id === entry.target.id);
        $('#' + entry.target.id).addClass("animate__animated");
        $('#' + entry.target.id).removeClass(elementAni.animation);
        $('#' + entry.target.id).addClass(elementAni.animation);
      }
    }
  });
  nodesAnimation = [];
  var eleAnima = [
    {
      id: "PAgradecimientos",
      animation: "animate__fadeInDown"
    },
    {
      id: "DivMesaLiverpool",
      animation: "animate__fadeInDown"
    },
    {
      id: "DivMesaAmazon",
      animation: "animate__fadeInDown"
    },
    {
      id: "DivWhatsapp",
      animation: "animate__fadeInDown"
    },
    {
      id: "H1NuestraBoda",
      animation: "animate__fadeInDown"
    },
    {
      id: "H3FechaNoviembre",
      animation: "animate__fadeInDown"
    },
    {
      id: "H2BelenEduardo",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblNosCasamos",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblSoloFaltan",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblUbica",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctCeremoniaIco",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblCeremonia",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblSabado11",
      animation: "animate__fadeInDown"
    },
    {
      id: "Lbl6pm",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblParroquia",
      animation: "animate__fadeInDown"
    },
    {
      id: "AMapaParroquia",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblSabadoQuinta",
      animation: "animate__fadeInDown"
    },
    {
      id: "Lbl8pm",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblQuintaTremen",
      animation: "animate__fadeInDown"
    },
    {
      id: "AMapaQuinta",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblNuestrosPadres",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctPadresNovia",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblMamaNovia",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblPapaNovia",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctVestido",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctPadresNovio",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblMamaNovio",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctTraje",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblNuestrosPadrinos",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctPadrinos",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblMadrina",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblPadrino",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblRecepcion",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblItinerario",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconInicio",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconIglesia",
      animation: "animate__fadeInDown"
    },
    {
      id: "DivCeremoniaReligiosa",
      animation: "animate__fadeInDown"
    },
    {
      id: "DivHoraCeremoniaReli",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha1",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlcIconApertura",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlcAperturaLbl",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctAperturaHora",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha2",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconCeremoniaCivil",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctLblInicioServicio",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctHoraInicioServicio",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha3",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconCena",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconBrindis",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconVals",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctInicioCoctele",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctHoraCocteleria",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha4",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlctIconBodaCivil",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlctIconBodaBrindis",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlctLblQuintaCivil",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctHoraCivil",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha5",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlctBaile",
      animation: "animate__fadeInDown"
    },
    {
      id: "SlctInicioEvento",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctHoraEvento",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha6",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconMusica",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctBailongo",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctBailongoHora",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFlecha7",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconFin",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctFinEvento",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctHoraFinEvento",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconCierre",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblCodigoVestimenta",
      animation: "animate__fadeInDown"
    },
    {
      id: "SctIconCodigos",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblFormalEtiqueta",
      animation: "animate__fadeInDown"
    },
    {
      id: "LblMesaRegalo",
      animation: "animate__fadeInDown"
    }
  ];
  for (let node of eleAnima) {
    nodesAnimation.push({
      node: document.querySelectorAll('#' + node.id),
      animation: node.animation,
      id: node.id
    });
  }
  // Observe each heading
  for (let node of nodesAnimation) {
    for (let heading of node.node) {
      observer.observe(heading);
    }
  }
});
var playMusic = false;
var onlyOne = true;