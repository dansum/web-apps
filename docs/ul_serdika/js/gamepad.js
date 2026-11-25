// Gamepad (Xbox, PlayStation and similar, "standard" layout in the browser).
// Shared by the three styles of the walk. poll() is called once per frame.
//   buttons: 0 A/✕, 1 B/◯, 2 X/▢, 3 Y/△, 6 LT/L2, 8 Back/Share, 9 Start/Options,
//            10 left stick pressed, 12–15 cross: up, down, left, right
export function createGamepad() {
  let prev = [];
  const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85);
  return {
    poll() {
      const pads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
      const gp = pads.find((p) => p && p.connected);
      if (!gp) { prev = []; return null; }
      const b = gp.buttons.map((x) => !!x && (x.pressed || x.value > 0.5));
      const was = prev;
      prev = b;
      const a = gp.axes;
      return {
        lx: dz(a[0] || 0), ly: dz(a[1] || 0), rx: dz(a[2] || 0), ry: dz(a[3] || 0),
        run: !!(b[10] || b[6]),
        pressed: (i) => !!b[i] && !was[i],
      };
    },
  };
}
