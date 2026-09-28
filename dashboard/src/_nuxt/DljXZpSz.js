import { Ht, b, k, mt, vn } from "./CoKk4mC0.js";
import { st } from "./Cd-sGgPF.js";
import { d as d_1, t } from "./B8_r5oP7.js";
const c = k({
  __name: `index`,
  setup(n) {
    let c = st();
    let l = d_1();
    let u = t();
    let d = vn(false);
    Ht(
      [() => l.tabIds.slice(), () => u.isInitializing],
      async ([e, t]) => {
        if (!(d.value || t)) {
          d.value = true;
          if (e.length > 0) {
            await c.replace({
              path: `/backtest/${e[0]}`,
            });
            return;
          }
          await l.addTab();
        }
      },
      {
        immediate: true,
      },
    );
    return (e, n) => {
      mt();
      return b(`div`);
    };
  },
});
export { c as default };
