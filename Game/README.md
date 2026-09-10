# Fantasy MMORPG Prototype - Phases 1 to 4

This package advances the previous prototype through Phase 4 and fixes the keyboard movement architecture.

## Important fix
Movement is now calculated relative to the camera, with explicit KeyW/KeyA/KeyS/KeyD handling, acceleration/deceleration, and a per-frame input system.

## Phase 3 - Third Person Camera
- Mouse orbit
- Camera yaw and pitch
- Mouse-wheel zoom
- Smooth camera follow
- Camera-relative movement directions
- Pointer lock support

## Phase 4 - Advanced Player Controller
- WASD movement
- Arrow-key movement
- Camera-relative movement
- Smooth acceleration
- Smooth deceleration
- Walk speed
- Sprint with Shift
- Jump with Space
- Gravity
- Ground detection
- Dodge with Q
- Smooth character rotation
- State display

## Controls
W A S D = move
Arrow keys = move
Shift = sprint
Space = jump
Q = dodge
Left mouse = camera control / pointer lock
Mouse wheel = zoom

## Run
Use a local server:
python -m http.server 8000

Then:
http://localhost:8000

Or use VS Code Live Server.

## Custom character
Optional:
assets/models/player.glb

The game works without it using the built-in fallback character.

## Next
Phase 5: Combat System
Phase 6: Enemy System
Phase 7: Targeting
Phase 8: Stats
Phase 9: Skills
