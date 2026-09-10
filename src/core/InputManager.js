export class InputManager {
  constructor() {
    this.keys = {};

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  endFrame() {
    // Keeps state persistent per frame
  }
}