/* Seu Comando · reconhecimento facial do ponto (face-api, MIT, roda no próprio aparelho).
   O rosto vira um código de 128 números (descritor). Só o código e a foto do cadastro ficam guardados;
   a comparação é feita no aparelho, na hora da marcação. Base legal: LGPD, art. 11, II, "g". */
(function (g) {
  'use strict';
  var pronto = null, MODELOS = 'assets/modelos-rosto';
  // Rigor: distância máxima entre o rosto da marcação e o do cadastro (quanto menor, mais rigoroso).
  var LIMIAR = { tolerante: 0.58, normal: 0.5, rigoroso: 0.43 };
  function script(src) {
    return new Promise(function (ok, no) {
      if (g.faceapi) return ok();
      var s = document.createElement('script'); s.src = src; s.async = true; s.onload = function () { ok(); }; s.onerror = function () { no(new Error('Não foi possível carregar o reconhecimento facial. Verifique a internet.')); };
      document.head.appendChild(s);
    });
  }
  function carregar() {
    if (pronto) return pronto;
    pronto = script('assets/js/vendor/face-api.js').then(function () {
      var f = g.faceapi;
      return f.tf.ready().then(function () {
        return Promise.all([f.nets.tinyFaceDetector.loadFromUri(MODELOS), f.nets.faceLandmark68TinyNet.loadFromUri(MODELOS), f.nets.faceRecognitionNet.loadFromUri(MODELOS)]);
      });
    }).catch(function (e) { pronto = null; throw e; });
    return pronto;
  }
  function opcoes() { return new g.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }); }
  // Só procura o rosto (rápido): serve para mostrar "rosto encontrado" enquanto a pessoa se posiciona.
  function achar(fonte) { return carregar().then(function () { return g.faceapi.detectSingleFace(fonte, opcoes()); }).then(function (d) { return d ? d.score : 0; }); }
  // Rosto + pontos + descritor. Devolve null se não houver exatamente um rosto nítido.
  function descritor(fonte) {
    return carregar().then(function () { return g.faceapi.detectSingleFace(fonte, opcoes()).withFaceLandmarks(true).withFaceDescriptor(); })
      .then(function (r) { return r && r.detection.score >= 0.6 ? Array.prototype.slice.call(r.descriptor) : null; });
  }
  function distancia(a, b) { var s = 0; for (var i = 0; i < 128; i++) { var d = (a[i] || 0) - (b[i] || 0); s += d * d; } return Math.sqrt(s); }
  function media(lista) { var m = []; for (var i = 0; i < 128; i++) { var s = 0; lista.forEach(function (d) { s += d[i]; }); m.push(+(s / lista.length).toFixed(6)); } return m; }
  g.Rosto = { carregar: carregar, achar: achar, descritor: descritor, distancia: distancia, media: media, LIMIAR: LIMIAR };
})(window);
