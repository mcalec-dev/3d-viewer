let lastFrameTime = Date.now();
let frameCount = 0;
let fps = 0;
function updateInfoDisplay() {
  const yawDisplay = document.getElementById("yawValue");
  const pitchDisplay = document.getElementById("pitchValue");
  const fpsDisplay = document.getElementById("fpsValue");
  if (!window.infoDisplay) {
    window.infoDisplay = {
      update: function(currentRotation) {
        if (yawDisplay) {
          yawDisplay.textContent = Math.round(currentRotation.ry * 100) / 100;
        }
        if (pitchDisplay) {
          pitchDisplay.textContent = Math.round(currentRotation.rx * 100) / 100;
        }
        frameCount++;
        const now = Date.now();
        const delta = now - lastFrameTime;
        if (delta >= 1000) {
          fps = Math.round((frameCount * 1000) / delta);
          frameCount = 0;
          lastFrameTime = now;
          if (fpsDisplay) {
            fpsDisplay.textContent = fps;
          }
        }
      }
    };
  }
}
document.addEventListener("DOMContentLoaded", () => {
  updateInfoDisplay();
});
